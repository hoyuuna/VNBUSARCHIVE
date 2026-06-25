export async function onRequest(context) {
    // Gọi các biến môi trường bạn đã cài đặt trong CF Pages Dashboard
    const config = {
        apiKey: context.env.FIREBASE_API_KEY,
        authDomain: context.env.FIREBASE_AUTH_DOMAIN,
        projectId: context.env.FIREBASE_PROJECT_ID,
        storageBucket: context.env.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: context.env.FIREBASE_MESSAGING_SENDER_ID,
        appId: context.env.FIREBASE_APP_ID,
        databaseURL: context.env.FIREBASE_DATABASE_URL
    };

    return new Response(JSON.stringify(config), {
        headers: { 'Content-Type': 'application/json' },
    });
}
