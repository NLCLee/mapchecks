// api/geocode.js
export default async function handler(req, res) {
	if (req.method !== "GET") return res.status(405).end();

	const { address } = req.query;
	if (!address) return res.status(400).json({ error: "주소가 없습니다." });

	try {
		// 카카오 로컬 API 호출
		const response = await fetch(
			`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(
				address
			)}`,
			{
				headers: {
					// 'KakaoAK ' 뒤에 한 칸 띄우고 키를 넣어야 합니다.
					Authorization: `KakaoAK ${process.env.KAKAO_REST_KEY}`,
				},
			}
		);

		const data = await response.json();

		if (!response.ok) {
			return res.status(response.status).json(data);
		}

		// 결과가 없을 경우 처리
		if (data.documents.length === 0) {
			return res.status(404).json({ error: "검색 결과가 없습니다." });
		}

		// 네이버 지도와 호환되도록 데이터 구조 정리 (첫 번째 결과값만 반환)
		const result = {
			x: data.documents[0].x, // 경도
			y: data.documents[0].y, // 위도
			address_name: data.documents[0].address_name,
		};

		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({ error: error.message });
	}
}
