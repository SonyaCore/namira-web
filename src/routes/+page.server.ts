import type { PageServerLoad } from './$types';
import axios from 'axios';
import { SECRET_KEY, API_URL } from '$env/static/private';
import { base64ToUint8Array, decryptAESGCM } from '$lib/utils';
import type { JobResult } from '$lib/types';

export const load: PageServerLoad = async () => {
	try {
		const response = await axios.get<string>(API_URL);
		const base64Data = response.data.trim();
		const encryptedBytes = base64ToUint8Array(base64Data);
		if (!SECRET_KEY) throw new Error('Encryption key not provided');
		const keyBytes = new TextEncoder().encode(SECRET_KEY);
		if (keyBytes.length !== 32) throw new Error('Key length is not 32 bytes');
		const decryptedJson = await decryptAESGCM(encryptedBytes, keyBytes);
		const jobResult = JSON.parse(decryptedJson) as JobResult;
		return { data: jobResult, error: null };
	} catch (err: unknown) {
		console.error(err);
		let message = 'خطای غیر منتظره. لطفا مجدد تلاش کنید.';
		if (axios.isAxiosError(err)) {
			if (err.response?.status === 404) {
				message = 'لیست دریافت نشد. اتصال خود را به اینترنت بررسی کنید.';
			} else {
				message = 'پاسخی از سرور دریافت نشد.';
			}
		}
		return { results: null, error: message };
	}
};
