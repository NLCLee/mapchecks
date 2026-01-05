// api/geocode.js
export default async function handler(req, res) {
	try {
		const { address } = req.query;

		if (!address) {
			return res.status(400).json({ error: "Address is required" });
		}

		// 환경변수 로드 확인
		const clientId = process.env.NCT_ID;
		const clientSecret = process.env.NCT_SECRET;

		if (!clientId || !clientSecret) {
			console.error("Environment variables missing!");
			return res
				.status(500)
				.json({ error: "Server environment variable missing" });
		}

		const response = await fetch(
			`https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(
				address
			)}`,
			{
				method: "GET",
				headers: {
					"X-NCP-APIGW-API-KEY-ID": clientId,
					"X-NCP-APIGW-API-KEY": clientSecret,
					Accept: "application/json",
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		return res.status(200).json(data);
	} catch (error) {
		// 500 에러 발생 시 원인을 Vercel 로그에 기록
		console.error("Geocode API Error:", error.message);
		return res.status(500).json({ error: error.message });
	}
}
