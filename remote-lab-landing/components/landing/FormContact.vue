<style scoped>
	.contact {
		@apply relative mx-auto rounded-lg border-0 border-primary p-0 container flex flex-col
			lg:bg-[url('~/assets/images/hero-1.png')] lg:bg-cover lg:bg-center lg:bg-no-repeat
			lg:border-2 lg:p-6 lg:flex-row
			lg:after:absolute lg:after:inset-0 lg:after:bg-black lg:after:bg-opacity-30
			lg:before:absolute lg:before:-inset-2 lg:before:z-10 lg:before:bg-white lg:before:[clip-path:polygon(15%_0,_40%_0,_50%_100%,_25%_100%)];
	}
	.contact__left {
		@apply z-20 relative w-full lg:w-1/2;
	}
	.contact__form__container {
		@apply mx-auto shadow-lg rounded-lg border p-6 max-w-lg flex flex-col gap-3 bg-white lg:translate-x-12;
	}
	.contact__form__container h1 {
		@apply font-bold text-2xl lg:text-4xl;
	}
	.contact__form__container p {
		@apply text-gray-500 italic;
	}
	.contact__form {
		@apply relative;
	}
	.contact__card__body {
		@apply flex flex-col gap-3;
	}
	.contact__group-input {
		@apply flex flex-col gap-1;
	}
	.contact__group-input label span {
		@apply text-red-500;
	}
	.contact__input {
		@apply rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary;
	}
	.contact__submit {
		@apply rounded-md mt-6 px-6 py-3 bg-primary text-white hover:saturate-50;
	}

	.contact__right {
		@apply relative w-full hidden justify-center items-center lg:w-1/2 lg:flex;
	}
	.contact__icon {
		@apply z-10 size-24 fill-white cursor-pointer transition hover:scale-110;
	}
	.contact__icon--sm {
		@apply size-12;
	}

	.contact__mobile {
		@apply relative rounded-lg mt-6 border-2 border-primary aspect-video w-full flex justify-center items-center 
			bg-[url('~/assets/images/hero-1.png')] bg-cover bg-center bg-no-repeat
			after:absolute after:inset-0 after:bg-black after:bg-opacity-30
			lg:hidden;
	}

	.contact__video {
		@apply fixed inset-0 z-50 flex justify-center items-center;
	}
	.contact__video__backdrop {
		@apply absolute inset-0 bg-black bg-opacity-70;
	}
	.contact__video video {
		@apply z-10 rounded-lg m-3 aspect-video w-full lg:w-9/12;
	}
</style>

<template>
	<section class="contact" id="contact">
		<div class="contact__left">
			<div class="contact__form__container">
				<h1>Đăng ký học thử ngay</h1>
				<p>Những trường bắt buộc được đánh dấu *</p>

				<form
					class="contact__form"
					action="https://docs.google.com/forms/u/0/d/e/1FAIpQLSfU6eZjm3aU9m3DKECCSZ1l5JatMbh53bUA5yk8VaDYsWChtA/formResponse"
					method="post">
					<div class="contact__form__card" id="section-0">
						<div class="contact__card__body">
							<div class="contact__group-input"><label for="entry.5708890">Họ và tên <span>*</span></label>
								<input class="contact__input" id="entry.5708890" name="entry.5708890" type="text" required="">
							</div>
							<div class="contact__group-input"><label for="entry.386961517">Số điện thoại <span>*</span></label>
								<input class="contact__input" id="entry.386961517" name="entry.386961517" type="text" required="">
							</div>
							<div class="contact__group-input"><label for="entry.772602942">Email <span>*</span></label>
								<input class="contact__input" id="entry.772602942" name="entry.772602942" type="text" required="">
							</div>
							<div class="contact__group-input"><label for="entry.686234839">Khu vực sinh sống <span>*</span></label>
								<input class="contact__input" id="entry.686234839" name="entry.686234839" type="text" required="">
							</div>
							<button type="submit" class="contact__submit">Gửi thông tin đăng ký</button>
						</div>
					</div>
				</form>
			</div>
		</div>

		<div class="contact__right">
			<IconCirclePlay class="contact__icon" @click="toggleVideo" />
		</div>

		<div class="contact__mobile">
			<IconCirclePlay class="contact__icon contact__icon--sm" @click="toggleVideo" />
		</div>

		<div class="contact__video" v-if="showVideo">
			<div class="contact__video__backdrop" @click="toggleVideo"></div>
			<video autoplay="" loop="" controls="" playsinline="" muted="">
				<source src="~/assets/videos/video-promotionnal.mp4" type="video/mp4">
			</video>
		</div>
	</section>
</template>

<script setup>
	const showVideo = ref(false);
	const toggleVideo = () => showVideo.value = !showVideo.value;
</script>
