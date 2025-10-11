<style scoped>
	.pricing {
		@apply mx-auto p-6 container;
	}
	.pricing__title {
		@apply mb-12 font-bold text-3xl text-primary uppercase text-center lg:text-4xl;
	}
	.pricing__content {
		@apply flex flex-col justify-around gap-6 lg:flex-row;
	}
	.pricing__card {
		@apply rounded-lg p-6 basis-1/4 flex flex-col gap-6;
	}
	.pricing__card__title {
		@apply rounded-lg border-2 border-primary px-6 py-3 text-4xl text-center;
	}
	.pricing__card__price {
		@apply text-center;
	}
	.pricing__card__features {
		@apply mb-6;
	}
	.pricing__card__feature {
		@apply flex items-center gap-1.5;
	}
	.pricing__card__button {
		@apply mt-auto rounded-md px-6 py-3 bg-primary text-center text-white hover:saturate-50;
	}
</style>

<template>
	<section class="pricing" id="pricing">
		<h2 class="pricing__title">
			Đăng ký với các gói ngay để nhận được ưu đãi
		</h2>

		<div class="pricing__content">
			<div class="pricing__card">
				<h3 class="pricing__card__title">Gói Basic</h3>
				<p class="pricing__card__price">
					<span class="text-3xl font-bold">100,000 đ</span>
				</p>
				<ul class="pricing__card__features">
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>E-Books</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Tài liệu Powerpoint</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Code minh họa</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Videos hướng dẫn</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Camera 1 góc nhìn</span>
					</li>
				</ul>
				<button class="pricing__card__button" @click="showPayment = true">Mua ngay</button>
			</div>

			<div class="pricing__card lg:shadow-[rgba(145,_158,_171,_0.16)_-40px_40px_80px]">
				<h3 class="pricing__card__title">Gói Plus</h3>
				<p class="pricing__card__price">
					<span class="text-3xl font-bold">Liên hệ</span>
				</p>
				<ul class="pricing__card__features">
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>E-Books</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Tài liệu Powerpoint</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Code minh họa</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Videos hướng dẫn</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Camera 2 góc nhìn</span>
					</li>
				</ul>
				<a href="#footer" class="pricing__card__button">Liên hệ</a>
			</div>

			<div class="pricing__card">
				<h3 class="pricing__card__title">Gói Pro</h3>
				<p class="pricing__card__price">
					<span class="text-3xl font-bold">Liên hệ</span>
				</p>
				<ul class="pricing__card__features">
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>E-Books</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Tài liệu Powerpoint</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Code minh họa</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Videos hướng dẫn</span>
					</li>
					<li class="pricing__card__feature">
						<IconCircleCheck class="shrink-0 size-4 fill-primary" />
						<span>Camera 4 góc nhìn</span>
					</li>
				</ul>
				<a href="#footer" class="pricing__card__button">Liên hệ</a>
			</div>
		</div>

		<LandingPayment v-model:visible="showPayment" />
	</section>
</template>

<script setup>
	const showPayment = ref(false);
</script>
