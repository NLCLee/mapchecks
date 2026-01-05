(() => {
	const form = document.getElementById("searchForm");
	const input = document.getElementById("q");
	const submitBtn = form?.querySelector('button[type="submit"]');
	if (!form || !input) return;

	// ✅ 회사 주소 고정
	const COMPANY = {
		name: "순두에너지",
		address: "인천 서구 청마로34번길 32-9",
	};

	let companyCoords = null; // { x, y, name }

	const normalize = (s) =>
		String(s || "")
			.trim()
			.replace(/\s+/g, " ");
	const safeName = (s) =>
		encodeURIComponent(
			String(s || "")
				.replace(/,/g, " ")
				.trim()
		);

	function setBusy(busy) {
		input.disabled = busy;
		if (submitBtn) {
			submitBtn.disabled = busy;
			submitBtn.textContent = busy ? "검색중..." : "검색";
		}
	}

	async function geocode(address) {
		const url = `/api/geocode?address=${encodeURIComponent(address)}`;
		const res = await fetch(url);

		let data;
		try {
			data = await res.json();
		} catch {
			throw new Error("GEOCODE_NON_JSON_RESPONSE");
		}

		// ✅ NCP 에러(210 등)면 그대로 올려서 원인 숨기지 않기
		if (data?.error?.errorCode) {
			const code = data.error.errorCode;
			const msg = data.error.details || data.error.message || "API error";
			throw new Error(`NCP_ERROR_${code}: ${msg}`);
		}

		const first = data?.addresses?.[0];
		if (!first?.x || !first?.y) return null;

		return {
			x: Number(first.x),
			y: Number(first.y),
			label: first.roadAddress || first.jibunAddress || address,
		};
	}

	function buildDirectionsUrl(from, to) {
		const sName = safeName(from.name);
		const gName = safeName(to.name);
		return `https://map.naver.com/v5/directions/${from.x},${from.y},${sName}/${to.x},${to.y},${gName}/-/car`;
	}

	async function initCompany() {
		try {
			const c = await geocode(COMPANY.address);
			if (!c) throw new Error("COMPANY_GEOCODE_NOT_FOUND");
			companyCoords = { x: c.x, y: c.y, name: COMPANY.name };
		} catch (e) {
			const msg = String(e?.message || e);
			// 회사 좌표가 없으면 서비스가 사실상 불가능하니 안내
			alert(
				"회사 주소 좌표 초기화에 실패했어요.\n" +
					`회사주소: ${COMPANY.address}\n` +
					`오류: ${msg}\n\n` +
					"(/api/geocode가 정상인지, NCP 키/구독이 정상인지 확인하세요.)"
			);
		}
	}

	async function onSearch() {
		const q = normalize(input.value);
		if (!q) return alert("고객 주소(지역/주소)를 입력해주세요.");

		if (!companyCoords) {
			// init이 실패했거나 아직 끝나지 않았을 수 있으니 재시도
			await initCompany();
			if (!companyCoords) return; // 그래도 실패하면 중단
		}

		setBusy(true);
		try {
			const customer = await geocode(q);
			if (!customer) {
				alert(
					"주소 검색 결과가 없어요.\n도로명+건물번호(또는 지번 번지)까지 더 자세히 입력해 주세요."
				);
				return;
			}

			// ✅ 회사 -> 고객
			const url = buildDirectionsUrl(
				{ x: companyCoords.x, y: companyCoords.y, name: companyCoords.name },
				{ x: customer.x, y: customer.y, name: customer.label }
			);

			window.open(url, "_blank", "noopener,noreferrer");
			// 필요하면 다음 페이지 이동
			// location.href = `installation.html?q=${encodeURIComponent(q)}`;
		} catch (e) {
			const msg = String(e?.message || e);

			if (msg.startsWith("NCP_ERROR_")) {
				alert(
					"지도 API 오류가 발생했어요.\n" +
						msg.replace(/^NCP_ERROR_/, "NCP ERROR ") +
						"\n\n(키/구독/프로젝트 매칭 문제일 가능성이 큽니다)"
				);
				return;
			}

			alert("처리 중 오류가 발생했어요.\n" + msg);
		} finally {
			setBusy(false);
		}
	}

	form.addEventListener("submit", (e) => {
		e.preventDefault();
		onSearch();
	});

	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			onSearch();
		}
	});

	// ✅ 페이지 로드시 회사 좌표 선계산
	initCompany();
})();
