<style scoped>
	.payment__container {
		@apply fixed inset-0 z-50 p-6 flex justify-center items-center;
	}
	.payment__backdrop {
		@apply absolute inset-0 z-0 bg-black/50;
	}
	.payment {
		@apply relative rounded-lg mx-auto max-w-screen-lg container w-full flex flex-col bg-white overflow-hidden;
	}
	.payment__milestone {
		@apply rounded-lg px-3 py-6 flex justify-between md:px-6;
	}
	.payment__step {
		@apply relative
			w-full flex flex-col justify-center items-center gap-3
			after:absolute after:top-3/4 after:left-1/2 after:-right-1/2 after:h-1 after:last:h-0;
	}
	.payment__step h3 {
		@apply mb-auto text-center text-sm font-bold lg:text-lg;
	}
	.payment__step button {
		@apply z-10 rounded-full aspect-square p-3 flex justify-center items-center font-bold text-white;
	}

	.payment__form__container {
		@apply relative flex-grow flex overflow-x-hidden;
	}
	.payment__form {
		@apply p-6 shrink-0 w-full flex flex-col justify-between gap-6 bg-white transition-all lg:px-12;
	}
	.payment__group-input {
		@apply w-full flex flex-col gap-1.5;
	}
	.payment__input {
		@apply rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary;
	}
	.payment__button {
		@apply rounded-md px-3 py-2 bg-primary text-white hover:saturate-50;
	}
</style>

<template>
	<div class="payment__container" v-if="visible">
		<div class="payment__backdrop" @click="hidePayment"></div>

		<div class="payment">
			<div class="payment__milestone">
				<div v-for="(step,i) in steps" :class="['payment__step', i + 1 < currentStep ? 'after:bg-primary' : 'after:bg-gray-300']">
					<h3 class="">{{ step }}</h3>
					<button :class="[i + 1 <= currentStep ? 'bg-primary' : 'bg-gray-300']">{{ i + 1 }}</button>
				</div>
			</div>

			<div class="payment__form__container">
				<!-- form 1 -->
				<form class="payment__form payment__form--1" @submit.prevent="createPayment">
					<div class="flex">
						<!-- left -->
						<div class="w-full flex flex-col gap-3">
							<h2 class="mb-3 text-3xl font-bold">Điền thông tin</h2>
							<div class="w-full flex flex-col gap-3 lg:flex-row">
								<div class="payment__group-input">
									<label for="last-name">Họ</label>
									<input type="text" id="last-name" class="payment__input" required v-model="paymentInfo.lastName" />
								</div>
								<div class="payment__group-input">
									<label for="first-name">Tên</label>
									<input type="text" id="first-name" class="payment__input" required v-model="paymentInfo.firstName" />
								</div>
							</div>
							<div class="payment__group-input">
								<label for="email">Email</label>
								<input type="email" id="email" class="payment__input" required v-model="paymentInfo.email" />
							</div>
							<div class="payment__group-input">
								<label for="phone">Số điện thoại</label>
								<input type="text" id="phone" class="payment__input" required v-model="paymentInfo.phone" />
							</div>
						</div>
						<!-- right -->
						<div class="w-full hidden justify-center lg:flex">
							<img src="@/assets/images/illustration-3.png" alt="illustraion-3" class="w-2/3 object-cover">
						</div>
					</div>
					<!-- buttons -->
					<div class="mt-auto flex justify-between items-center">
						<button class="payment__button" @click="hidePayment">Thoát</button>
						<button type="submit" class="payment__button">Tiếp theo</button>
					</div>
				</form>

				<!-- form 2 -->
				<div :class="['payment__form', currentStep == 2 && '-translate-x-full', currentStep == 3 && 'order-last']">
					<div class="flex flex-col justify-center items-center gap-6 text-center">
						<h3 class="text-3xl font-bold">Quét mã QR để thanh toán</h3>
						<img :src="qrPaymentUrl" alt="qr-payment" class="max-w-72">
						<a :href="checkoutUrl" class="text-blue-600 hover:underline">Hoặc nhấn vào đây để đến trang thanh toán</a>
					</div>

					<div class="mt-auto flex justify-between items-center">
						<button class="payment__button" @click="prevStep">Quay lại</button>
						<button class="payment__button" @click="checkPaymentStatus">Kiểm tra thanh toán</button>
					</div>
				</div>

				<!-- form 3 -->
				<div :class="['payment__form', currentStep == 3 && '-translate-x-full']">
					<div class="h-full flex flex-col justify-center items-center gap-6 text-center">
						<h3 class="text-3xl font-bold">Thanh toán thành công</h3>
						<IconCircleCheck2 class="size-48 fill-green-500" />
						<div>
							<p>Thông tin đã được gửi đến địa chỉ email của bạn.</p>
							<p>Trường hợp không tìm thấy trong hộp thư đến, bạn vui lòng liên hệ với chúng tôi để được trợ giúp nhé.</p>
						</div>
					</div>

					<div class="mt-auto flex justify-end items-center">
						<button class="payment__button" @click="closePayment">Đóng</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
	import axios from "axios";
	import swal from "sweetalert2";
	import { API_BASE_URL } from "~/config/api.js";

	const props = defineProps(['visible']);
	const emit = defineEmits(['update:visible']);
	const currentStep = ref(1);
	const steps = ref([
		'Điền thông tin',
		'Thanh toán',
		'Kết quả'
	]);
	const paymentInfo = ref({
		firstName: '',
		lastName: '',
		email: '',
		phone: '',
		courseId: 3
	});
	const formLoading = ref(false);
	const qrPaymentUrl = ref('');
	const checkoutUrl = ref('');
	const orderCode = ref('');

	function prevStep() {
		if (currentStep.value == 1) return;
		currentStep.value--;
	}

	function nextStep() {
		if (currentStep.value == 3) return;
		currentStep.value++;
	}

	function hidePayment() {
		emit('update:visible', false);
	}

	async function createPayment(e) {
		if (formLoading.value) return;
		formLoading.value = true;

		try {
			let response = await axios.post(`${API_BASE_URL}/api/payment`, paymentInfo.value);

			let { bin, accountNumber, amount, description } = response.data.data;
			qrPaymentUrl.value = `https://img.vietqr.io/image/${bin}-${accountNumber}-qr_only.jpg?addInfo=${description}&amount=${amount}`;
			checkoutUrl.value = response.data.data.checkoutUrl;
			orderCode.value = response.data.data.orderCode;

			nextStep();
		}
		catch (error) {
			swal.fire({
				icon: 'error',
				title: 'Lỗi',
				text: error.response.data.message
			});
		}
		finally {
			formLoading.value = false;
		}
	}

	async function checkPaymentStatus() {
		try {
			let response = await axios.get(`https://remote-lab.rm.s4h.edu.vn/api/payment/${orderCode.value}`);
			let { status } = response.data.data;

			if (status != 'PAID') return swal.fire({
				icon: 'info',
				title: 'Thông báo',
				text: 'Chưa nhận được thanh toán từ bạn. Hãy kiểm tra lại trạng thái thanh toán sau ít phút nhé.'
			});

			if (status == 'PAID') await axios.post(`https://remote-lab.rm.s4h.edu.vn/api/payment/complete/?orderCode=${orderCode.value}`);

			nextStep();
		}
		catch (error) {
			console.log(error.response.data);
		}
	}

	function closePayment() {
		hidePayment();
		currentStep.value = 1;
		paymentInfo.value = {
			firstName: '',
			lastName: '',
			email: '',
			phone: '',
			courseId: 3
		};
	}
</script>
