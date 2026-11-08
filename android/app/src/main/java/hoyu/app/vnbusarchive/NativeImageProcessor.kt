package hoyu.app.vnbusarchive

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.ImageDecoder
import android.graphics.Matrix
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.io.InputStream
import kotlin.math.roundToInt

object NativeImageProcessor {

    /**
     * Đọc metadata EXIF cực nhanh từ InputStream thông qua Android ExifInterface Native
     */
    suspend fun extractExif(context: Context, uri: Uri): String = withContext(Dispatchers.IO) {
        val result = JSONObject()
        try {
            var inputStream: InputStream? = context.contentResolver.openInputStream(uri) ?: return@withContext "{}"
            val exif = ExifInterface(inputStream)
            inputStream.close()

            val make = exif.getAttribute(ExifInterface.TAG_MAKE)?.trim() ?: ""
            val model = exif.getAttribute(ExifInterface.TAG_MODEL)?.trim() ?: ""
            val camera = if (model.isNotEmpty()) {
                if (make.isNotEmpty() && !model.contains(make, ignoreCase = true)) "$make $model" else model
            } else make

            val date = exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL)
                ?: exif.getAttribute(ExifInterface.TAG_DATETIME)
                ?: ""

            val fNumber = exif.getAttributeDouble(ExifInterface.TAG_F_NUMBER, 0.0)
            val expTime = exif.getAttribute(ExifInterface.TAG_EXPOSURE_TIME) ?: ""
            val iso = exif.getAttributeInt(ExifInterface.TAG_PHOTOGRAPHIC_SENSITIVITY, 0)
            val focal = exif.getAttributeDouble(ExifInterface.TAG_FOCAL_LENGTH, 0.0)

            val paramsList = mutableListOf<String>()
            if (focal > 0) paramsList.add("${focal.roundToInt()}mm")
            if (fNumber > 0) paramsList.add("f/${String.format("%.1f", fNumber)}")
            if (expTime.isNotEmpty()) paramsList.add("${expTime}s")
            if (iso > 0) paramsList.add("ISO $iso")

            val latLong = FloatArray(2)
            val hasGps = exif.getLatLong(latLong)

            result.put("camera", camera)
            result.put("date", date)
            result.put("params", paramsList.joinToString(" • "))
            if (hasGps) {
                result.put("latitude", latLong[0].toDouble())
                result.put("longitude", latLong[1].toDouble())
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return@withContext result.toString()
    }

    /**
     * Giải mã ảnh HEIC/HEIF hoặc RAW/JPEG cực nhanh bằng Android Hardware ImageDecoder
     * Trả về Base64 PNG hoặc WebP
     */
    suspend fun decodeImageToBase64(context: Context, uri: Uri, maxDimension: Int = 3840): String = withContext(Dispatchers.IO) {
        try {
            val bitmap: Bitmap = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val source = ImageDecoder.createSource(context.contentResolver, uri)
                ImageDecoder.decodeBitmap(source) { decoder, info, _ ->
                    decoder.allocator = ImageDecoder.ALLOCATOR_SOFTWARE
                    val width = info.size.width
                    val height = info.size.height
                    if (width > maxDimension || height > maxDimension) {
                        val ratio = width.toFloat() / height.toFloat()
                        val targetW: Int
                        val targetH: Int
                        if (ratio > 1) {
                            targetW = maxDimension
                            targetH = (maxDimension / ratio).roundToInt()
                        } else {
                            targetH = maxDimension
                            targetW = (maxDimension * ratio).roundToInt()
                        }
                        decoder.setTargetSize(targetW, targetH)
                    }
                }
            } else {
                val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                context.contentResolver.openInputStream(uri)?.use {
                    BitmapFactory.decodeStream(it, null, options)
                }
                var inSampleSize = 1
                while (options.outWidth / inSampleSize > maxDimension || options.outHeight / inSampleSize > maxDimension) {
                    inSampleSize *= 2
                }
                val decodeOptions = BitmapFactory.Options().apply {
                    this.inSampleSize = inSampleSize
                    inPreferredConfig = Bitmap.Config.ARGB_8888
                }
                context.contentResolver.openInputStream(uri)?.use {
                    BitmapFactory.decodeStream(it, null, decodeOptions)
                } ?: return@withContext ""
            }

            val baos = ByteArrayOutputStream()
            bitmap.compress(Bitmap.CompressFormat.JPEG, 92, baos)
            val bytes = baos.toByteArray()
            bitmap.recycle()
            return@withContext "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext ""
        }
    }

    /**
     * Cắt ảnh và xoay ma trận chuẩn bằng Android Hardware Codec (Native Crop)
     */
    suspend fun processCropNative(
        context: Context,
        imageUri: Uri,
        cropX: Float,
        cropY: Float,
        cropWidth: Float,
        cropHeight: Float,
        rotationDeg: Float,
        quality: Int = 92
    ): String = withContext(Dispatchers.IO) {
        try {
            var inputStream: InputStream? = context.contentResolver.openInputStream(imageUri)
                ?: return@withContext ""
            val originalBitmap = BitmapFactory.decodeStream(inputStream)
            inputStream?.close()

            if (originalBitmap == null) return@withContext ""

            val matrix = Matrix()
            if (rotationDeg != 0f) {
                matrix.postRotate(rotationDeg)
            }

            val rotated = if (rotationDeg != 0f) {
                Bitmap.createBitmap(originalBitmap, 0, 0, originalBitmap.width, originalBitmap.height, matrix, true)
            } else {
                originalBitmap
            }

            val safeX = cropX.coerceIn(0f, (rotated.width - 1).toFloat()).toInt()
            val safeY = cropY.coerceIn(0f, (rotated.height - 1).toFloat()).toInt()
            val safeW = cropWidth.coerceIn(1f, (rotated.width - safeX).toFloat()).toInt()
            val safeH = cropHeight.coerceIn(1f, (rotated.height - safeY).toFloat()).toInt()

            val croppedBitmap = Bitmap.createBitmap(rotated, safeX, safeY, safeW, safeH)

            val baos = ByteArrayOutputStream()
            croppedBitmap.compress(Bitmap.CompressFormat.JPEG, quality.coerceIn(50, 100), baos)
            val bytes = baos.toByteArray()

            if (rotated != originalBitmap) rotated.recycle()
            croppedBitmap.recycle()
            originalBitmap.recycle()

            return@withContext "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP)
        } catch (e: Exception) {
            e.printStackTrace()
            return@withContext ""
        }
    }
}
