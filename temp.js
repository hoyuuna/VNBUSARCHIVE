const fs = require('fs');
let css = fs.readFileSync('public/css/light.css', 'utf8');

const regex = /\/\* 2\. CHI TIẾT ẢNH & ẢNH TÂM ĐẮC \*\/[\s\S]*?\/\* 3\. DROPDOWN \(Search, Filter, v\.v\) \*\//;

const replacement = `/* 2. CHI TIẾT ẢNH & ẢNH TÂM ĐẮC */
/* Khung bọc ngoài ảnh chi tiết (detail-image) */
#detail .img-wrapper {
    border: 1px solid #18181b !important;
    box-sizing: border-box;
}

/* Ảnh tâm đắc trên Profile: 
   Chỉ cần đổi viền của wrapper có sẵn, bỏ viền đúp ở img con */
.border-gray-200\\/60 {
    border-color: #18181b !important;
}

/* Modal chọn ảnh tâm đắc (preview lúc nhập link) */
#fav-photo-preview-img {
    border: 1px solid #18181b !important;
}

/* Khung ảnh model preview trong upload */
#up-model-preview .border-gray-300 {
    border-color: #18181b !important;
}

/* 3. DROPDOWN (Search, Filter, v.v) */`;

if (css.match(regex)) {
    css = css.replace(regex, replacement);
    fs.writeFileSync('public/css/light.css', css);
    console.log('Fixed double borders!');
} else {
    console.log('Could not find regex match in light.css');
}
