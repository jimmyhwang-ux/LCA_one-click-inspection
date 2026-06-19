// Vercel Serverless Function
// POST { password: string } -> { token: string }
// 환경변수: OCCC_PASSWORD (접속 비밀번호), OCCC_SECRET (토큰 서명 키)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const password     = process.env.OCCC_PASSWORD;
  const secret       = process.env.OCCC_SECRET;

  if (!password || !secret) {
    return res.status(500).json({ error: { message: '서버 설정이 올바르지 않습니다.' } });
  }

  const { password: input = '' } = req.body || {};

  if (!input || input !== password) {
    // 틀린 비밀번호 — 응답 지연으로 브루트포스 방어
    await new Promise(r => setTimeout(r, 600));
    return res.status(401).json({ error: { message: '비밀번호가 올바르지 않습니다.' } });
  }

  // 토큰 생성: base64(payload) + HMAC 서명
  const exp     = Date.now() + 1000 * 60 * 60 * 24; // 24시간
  const payload = JSON.stringify({ exp });
  const b64     = Buffer.from(payload).toString('base64url');

  // HMAC-SHA256 서명
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(b64));
  const sigB64 = Buffer.from(sig).toString('base64url');
  const token = `${b64}.${sigB64}`;

  return res.status(200).json({ token });
}
