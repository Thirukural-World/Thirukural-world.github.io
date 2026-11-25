const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const messaging = admin.messaging();

async function sendDailyKural() {
  // Calculate today's Kural number (1 to 1330) in IST (UTC+5:30)
  const nowUtc = new Date();
  const istTime = new Date(nowUtc.getTime() + 5.5 * 60 * 60 * 1000);
  const startOfYear = new Date(Date.UTC(istTime.getUTCFullYear(), 0, 0));
  const dayOfYear = Math.floor((istTime - startOfYear) / (1000 * 60 * 60 * 24));

  const kuralNum = ((dayOfYear - 1) % 1330) + 1;
  const chapterNum = Math.floor((kuralNum - 1) / 10) + 1;
  const formattedCh = String(chapterNum).padStart(3, "0") + "-Chapter";

  // Fetch today's Kural from Firestore
  const chapterDoc = await db.collection("chapters").doc(formattedCh).get();
  if (!chapterDoc.exists) throw new Error("Chapter not found: " + formattedCh);

  const kuralObj = (chapterDoc.data().kurals || []).find(k => Number(k.num) === kuralNum);
  const title = `📜 இன்றைய குறள் #${kuralNum} (அதிகாரம் ${chapterNum})`;
  const body = kuralObj ? `${kuralObj.line1}\n${kuralObj.line2}` : "இன்றைய திருக்குறளை வாசிக்கவும்!";

  // Fetch all enabled subscribers (both 6 AM fixed and custom-time users)
  const snap = await db.collection("fcm_subscribers").where("enabled", "==", true).get();
  if (snap.empty) {
    console.log("No active subscribers found.");
    return;
  }

  const tokens = [];
  const docRefs = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (data.token) {
      tokens.push(data.token);
      docRefs.push(doc.ref);
    }
  });

  const message = {
    notification: { title, body },
    webpush: {
      notification: {
        icon: "https://thirukural-world.github.io/images/Thirukural_World_192.png",
        badge: "https://thirukural-world.github.io/images/Thirukural_World_192.png"
      },
      fcmOptions: {
        link: `https://thirukural-world.github.io/index.html?page=chapters&ch=${chapterNum}&kural=${kuralNum}`
      }
    },
    tokens
  };

  const response = await messaging.sendEachForMulticast(message);
  console.log(`Sent: ${response.successCount}, Failed: ${response.failureCount}`);

  // Clean up expired/uninstalled tokens automatically
  const cleanup = [];
  response.responses.forEach((resp, idx) => {
    if (!resp.success && resp.error?.code === "messaging/registration-token-not-registered") {
      cleanup.push(docRefs[idx].delete());
    }
  });
  await Promise.all(cleanup);
}

sendDailyKural().catch(err => {
  console.error(err);
  process.exit(1);
});
