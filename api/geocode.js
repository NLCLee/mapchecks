// api/geocode.js
const data = await naverResponse.json();
console.log("네이버 응답 데이터:", JSON.stringify(data)); // Vercel 로그에서 확인 가능


export default async function handler(req, res) {
	// 1. GET 요청인지 확인
	if (req.method !== "GET") {
		return res.status(405).json({ error: { message: "Method Not Allowed" } });
	}

	const { address } = req.query;

	// 2. 주소 파라미터 체크
	if (!address) {
		return res.status(400).json({ error: { message: "Address is required" } });
	}

	try {
		// 3. 네이버 Geocoding API 호출
		// Vercel 환경 변수에 설정하신 NCT_ID와 NCT_SECRET을 사용합니다.
		const naverResponse = await fetch(
			`https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(
				address
			)}`,
			{
				method: "GET",
				headers: {
					X-NCP-APIGW-API-KEY-ID: process.env.NCP_API_KEY_ID,
					X-NCP-APIGW-API-KEY: process.env.NCP_API_KEY,
					Accept: "application/json",
				},
			}
		);

		const data = await naverResponse.json();

		// 4. 네이버 서버 응답이 OK가 아닌 경우 (210 에러 등 처리)
		if (!naverResponse.ok) {
			return res.status(naverResponse.status).json({
				error: {
					errorCode: data.error?.errorCode || naverResponse.status,
					message: data.error?.message || "Naver API Error",
					details: data.error?.details || "",
				},
			});
		}

		// 5. 성공 시 데이터 반환
		return res.status(200).json(data);
	} catch (error) {
		console.error("Geocoding Error:", error);
		return res.status(500).json({
			error: { message: "Internal Server Error", details: error.message },
		});
	}
}



