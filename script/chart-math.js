// a 최고점의 높이
// b 최고점의 위치
// c 퍼진 정도
function gaussian(x, a, b, c) {
	return a * Math.exp((-((x - b) ** 2) / 2) * c ** 2);
}

function toHistogram(data, { size, min, max }) {
	let cmin = Infinity;
	let cmax = -Infinity;

	for (const item of data) {
		if (item < cmin) cmin = item;
		else if (item > cmax) cmax = item;
	}

	min = min != undefined ? min : cmin;
	max = max != undefined ? max : cmax;

	const histoSize = Math.ceil((max - min + 1) / size);

	const res = new Array(histoSize).fill(0);

	for (const item of data) {
		const index = Math.floor((item - min) / size);
		if (0 <= index && index < res.length) res[index]++;
	}

	return { data: res, info: { min, max } };
}

function applyAmbientWeights(list, around) {
	const size = list.length;
	const ret = new Array(size).fill(0);
	for (let i = 0; i < size; i++) {
		let sum = 0;
		let count = 0;
		const start = Math.max(0, i - around);
		const end = Math.min(size - 1, i + around);
		for (let j = start; j <= end; j++) {
			const diff = Math.abs(i - j);
			const diffRatio = diff / around || 0;
			const weight = gaussian(diffRatio, 1, 0, 3.5);
			if (list[j] > 0) {
				sum += weight * list[j];
				count++;
			}
		}

		ret[i] = sum;
	}
	return ret;
}
