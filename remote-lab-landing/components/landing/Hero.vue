<style scoped>
	.hero__content__container {
		@apply relative z-10 shadow-xl m-6 -mt-12 rounded-lg bg-white;
	}
	.hero__content {
		@apply p-6 mx-auto container w-full h-auto flex gap-6;
	}
	.hero__content--left {
		@apply w-full flex flex-col gap-3 lg:w-2/5;
	}
	.hero__content--right {
		@apply relative hidden shrink-0 w-3/5 h-full overflow-hidden lg:h-96 lg:block;
	}
	.hero__subtitle {
		@apply rounded-full p-1.5 w-fit flex items-center gap-3 bg-primary font-bold;
	}
	.hero__subtitle__highlight {
		@apply rounded-full px-3 py-0.5 bg-white text-primary;
	}
	.hero__subtitle__normal {
		@apply pr-3 text-white;
	}
	.hero__title {
		@apply text-4xl font-bold;
	}
	.hero__description {
		@apply z-10 text-justify font-bold lg:w-[120%];
	}
	.hero__gallery--rotate {
		@apply origin-top -rotate-12;
	}
	.hero__gallery--scroll {
		@apply scale-125;
		animation: anim-scroll 10s linear infinite;
	}
	.hero__gallery--deco {
		@apply absolute inset-0 bg-white [clip-path:polygon(0%_100%,15%_100%,20%_0%,0%_0%)];
	}

	@keyframes anim-scroll {
		0% {
			transform: translateY(0);
		}
		100% {
			transform: translateY(-50%);
		}
	}
</style>

<template>
		<header class="hero">
			<div class="aspect-video w-full bg-center bg-cover bg-[url('~/assets/images/hero-2.png')] lg:bg-[url('~/assets/images/hero-1.png')]"></div>

			<div class="hero__content__container">
				<div class="hero__content">
					<div class="hero__content--left">
						<div class="hero__subtitle">
							<span class="hero__subtitle__highlight">Khoá học</span>
							<span class="hero__subtitle__normal">IoT</span>
						</div>
						<h1 class="hero__title">Remote Lab</h1>
						<p class="hero__description">
							Remote Lab là giải pháp tiên tiến giúp khắc phục hạn chế trong việc đào tạo
							trực tuyến các ngành kỹ thuật công nghệ, vốn yêu cầu thực hành trên thiết bị
							thực tế tại phòng thí nghiệm. Mặc dù học tập trực tuyến phù hợp với các
							chuyên ngành kinh tế và ngôn ngữ, nhưng với sự phát triển của cơ sở hạ tầng
							internet, Remote Lab mở ra cơ hội học tập từ xa cho các ngành đòi hỏi thực hành, giúp
							loại bỏ rào cản về địa lý, không gian và thời gian. Đây là một bước tiến
							quan trọng trong giáo dục kỹ thuật số.
						</p>
					</div>

					<div class="hero__content--right">
						<div class="hero__gallery--rotate">
							<img src="~/assets/images/hero-grid.png" alt="hero-gallery" class="hero__gallery--scroll">
						</div>
						<div class="hero__gallery--deco"></div>
					</div>
				</div>
			</div>
		</header>
</template>
