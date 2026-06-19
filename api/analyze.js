// Vercel Serverless Function
// POST { title?: string, content: string } -> { raw: string }
// API 키는 절대 클라이언트로 노출되지 않고, 서버 환경변수(ANTHROPIC_API_KEY)에서만 사용됩니다.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: { message: '서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.' } });
  }

  const { title = '', content = '' } = req.body || {};
  if (!content || !content.trim()) {
    return res.status(400).json({ error: { message: '본문 내용이 비어있습니다.' } });
  }

  const prompt = `너는 명품 중고거래 검수 보조 AI야.
아래 본문에서 각 검수 항목에 해당하는 내용을 찾아 원문 그대로 발췌해줘.
절대 요약하거나 해석하지 마. 본문에 있는 표현을 그대로 가져와.

[검수 항목 및 발췌 기준]
1. 모델명/색상/소재 — 브랜드명, 모델명, 색상, 소재 관련 표현. 발췌된 내용이 2줄 이상이고 서로 모델명/색상/소재가 실제로 다른 경우(예: 한 줄은 블랙, 다른 줄은 화이트), 항목명 뒤에 [상이] 태그를 추가. 단순히 표현 방식만 다르거나 같은 내용을 다르게 서술한 경우는 [상이] 태그를 붙이지 말 것
2. 사이즈 — 사이즈, 치수, 호수 관련 표현. "60*24*26", "25x18x10", "W25 H18 D10"처럼 단위나 "사이즈"라는 단어 없이 숫자와 기호(x, *, ·, /)만으로 가로/세로/폭 치수를 나열한 표현도 반드시 사이즈로 포함
3. 새상품 여부 — 새상품, 미사용, 미착용, 선물, 데드스톡 관련 표현 + 새상품/미사용으로 기재된 경우에 한해, 실제 착용/사용 행위를 나타내는 표현(몇 번 착용, 잠깐 사용, 한 번 써봄 등)도 함께 발췌. 단, 제품 자체의 소재·가공·디자인 설명은 이 항목에 포함하지 말 것
4. 제조 연식 각인 — 에르메스, 샤넬, 롤렉스 제품에 한해서만 시리얼, 제조년도, 각인, 날짜 관련 표현을 발췌. 위 3개 브랜드가 아니면 본문에 시리얼/각인 표현이 있어도 발췌하지 말고 ❌로 처리
5. 기재 구성품 — 케이스, 박스, 보증서, 쇼핑백, 부속품, 영수증, 인보이스, 택(tag) 관련 표현. "단품", "본품만" 처럼 구성품 없이 제품 자체만 보낸다는 표현은 절대 발췌하지 말고 ❌로 처리
6. 수선/각인 여부 — 수선, 수리, 이니셜, 각인, 커스텀 관련 표현
7. 하자 기재 여부 — 파손, 찍힘, 깨짐, 찢김, 변형 등 기능/형태에 영향을 주는 물리적 손상 표현만 발췌. 스크래치, 밑창 마모, 보풀, 변색, 얼룩 같은 외관상 흔적은 절대 이 항목에 넣지 말 것
8. 사용감 참고 — 아래 두 가지를 모두 이 항목으로 분류
   ① 스크래치, 밑창 마모, 보풀, 변색, 얼룩 등 자연스러운 외관 사용 흔적
   ② 제품 자체의 소재·가공·디자인 특성 설명 (예: "원래 디스트레스드 가공", "밑창이 원래 노란빛" 등 검수자가 실물 확인 시 참고할 외관 표현)

[출력 규칙 - 반드시 지켜]
- 항목명 뒤에 해당 내용이 있으면 🔵, 없으면 ❌
- 🔵인 항목은 바로 다음 줄부터 관련 원문을 ▪ 로 시작해서 한 문장씩 한 줄에 하나씩
- 원문에서 해당 항목 관련 문장이 여러 개면 전부 각각 ▪ 로 나열
- 원문을 절대 바꾸지 말고, 묶거나 합치지 말 것
- 번호, 인사말, 설명 없이 결과만 출력

[출력 예시]
모델명/색상/소재 🔵
▪ (급처)샤넬 cc로고 귀걸이
▪ 샴페인골드 색상이고 심플한 기본디자인이라

[상이 케이스 예시]
모델명/색상/소재 🔵 [상이]
▪ 블랙 컬러 구찌 마몽 백
▪ 화이트 컬러로 판매합니다
사이즈 🔵
▪ 60*24*26
새상품 여부 🔵
▪ (새상품)선물가능
▪ 선물받은 새상품
제조 연식 각인 ❌
하자 기재 여부 ❌
사용감 참고 🔵
▪ 밑창 원래 디스트레스드 가공이 되어있어 조금 노란빛이 돈다
▪ 손잡이 부분 스크래치 있음

[참고: 브랜드가 에르메스/샤넬/롤렉스가 아닌 경우]
제조 연식 각인 ❌

[참고: 본문에 "단품이고"처럼 구성품 없음을 나타내는 표현만 있는 경우]
기재 구성품 ❌

본문: ${title ? title + '\n' : ''}${content}`;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: { message: data.error?.message || `HTTP ${upstream.status}` } });
    }

    const raw = (data.content || []).map(b => b.text || '').join('');
    return res.status(200).json({ raw });

  } catch (e) {
    return res.status(500).json({ error: { message: e.message || '서버 오류가 발생했습니다.' } });
  }
}
