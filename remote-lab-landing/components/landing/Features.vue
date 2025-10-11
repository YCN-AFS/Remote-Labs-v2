<style scoped>
	.feature {
		@apply overflow-x-hidden;
	}
	.feature__subtitle {
		@apply block text-center text-lg font-bold uppercase;
	}
	.feature__title {
		@apply mb-12 text-3xl text-primary text-center font-bold uppercase lg:text-4xl;
	}
	.feature__content {
		@apply flex flex-col items-center gap-6 lg:flex-row;
	}
	.feature__content__left {
		@apply relative w-full lg:w-1/2;
	}
	.feature__content__right {
		@apply order-first w-full px-6 flex flex-col gap-1.5 lg:w-1/2 lg:order-none;
	}
	.feature__heading {
		@apply mt-3 text-center text-xl font-bold uppercase lg:mt-0 lg:text-3xl;
	}
	.feature__paragraph {
		@apply text-center text-lg lg:text-left;
	}
	.feature__connector {
		@apply relative w-full hidden justify-center items-center lg:flex;
	}
	.feature__image {
		@apply p-0 rounded-md aspect-[4/3] w-full object-cover lg:p-3;
	}
	.feature__image--right {
		@apply bg-[#991f22];
	}
	.feature__image--left {
		@apply bg-[#06377b];
	}
	.feature__illus {
		@apply absolute z-20 w-2/5 hidden lg:block;
	}
	.feature__illus--right {
		@apply -bottom-6 -right-12 rotate-12;
	}
	.feature__illus--left {
		@apply -bottom-24 left-0 w-2/6 -rotate-12;
	}
</style>

<template>
	<section class="feature" id="feature">
		<span class="feature__subtitle">- Ielts Hacker -</span>
		<h2 class="feature__title">
			Đặc quyền trong thời gian đăng ký trải nghiệm
		</h2>

		<div class="feature__content">
			<div class="feature__content__left">
				<img src="~/assets/images/feature-1.png" alt="feature-1" class="feature__image feature__image--left border">
			</div>
			<div class="feature__content__right">
				<h3 class="feature__heading">Tài Liệu Học Tập</h3>
				<p class="feature__paragraph">
					Người dùng có thể khám phá và truy cập vào một kho tài liệu đa phương tiện
					đa dạng, bao gồm không chỉ video bài giảng mà còn các hoạt động luyện tập,
					tài liệu phụ trợ và nhiều nội dung hấp dẫn khác.
				</p>
			</div>
		</div>

		<div class="feature__connector">
			<svg width="700" height="300" viewBox="0 0 700 300" fill="none" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="MyGradient">
						<stop offset="0%" stop-color="#06377b"></stop>
						<stop offset="100%" stop-color="#991f22"></stop>
					</linearGradient>
				</defs>
				<path d="M0,0 Q50,200 345,204 T690,408" stroke="url(#MyGradient)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="20 20"></path>
				<path d="M690,408Q640,208 345,204Q50,200 0,0" stroke="url(#line1-gradient)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="0px 1px"></path>
			</svg>

			<img src="~/assets/images/illustration-1.png" alt="illus-1" class="feature__illus feature__illus--right">
		</div>

		<div class="feature__content">
			<div class="feature__content__left lg:order-last ">
				<img src="~/assets/images/feature-2.png" alt="feature-2" class="feature__image feature__image--right">
			</div>
			<div class="feature__content__right">
				<h3 class="feature__heading">Thực hành trực tuyến</h3>
				<p class="feature__paragraph">
					Thực hành trực tuyến với giải pháp Remote Lab giúp sinh viên kỹ thuật dễ dàng
					tiếp cận thiết bị thí nghiệm từ xa, loại bỏ hạn chế về địa lý và tiết kiệm
					thời gian, chi phí đi lại. Remote Lab cho phép giám sát và điều khiển thiết bị
					qua mạng, mang lại trải nghiệm thực hành thực tế nhưng linh hoạt hơn. Sinh viên
					cũng có thể truy cập tài liệu, video bài giảng và tham gia thảo luận trên
					diễn đàn, giúp quá trình học tập toàn diện hơn. Đây là giải pháp tối ưu cho
					việc thực hành kỹ thuật trong môi trường giáo dục hiện đại.
				</p>
			</div>
		</div>

		<div class="feature__connector">
			<svg width="700" height="300" viewBox="0 0 700 300" fill="none" xmlns="http://www.w3.org/2000/svg" class="scale-x-[-1]">
				<path d="M0,0 Q50,200 345,204 T690,408" stroke="url(#MyGradientd)" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="20 20"></path>
				<path d="M690,408Q640,208 345,204Q50,200 0,0" stroke="white" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dashoffset="0px" stroke-dasharray="0px 1px"></path>
				<defs>
					<linearGradient id="MyGradientd">
						<stop offset="0%" stop-color="#991f22"></stop>
						<stop offset="100%" stop-color="#06377b"></stop>
					</linearGradient>
				</defs>
			</svg>

			<img src="~/assets/images/illustration-2.png" alt="illus-2" class="feature__illus feature__illus--left">
		</div>

		<div class="feature__content">
			<div class="feature__content__left">
				<img src="~/assets/images/feature-3.png" alt="feature-3" class="feature__image feature__image--left">
			</div>
			<div class="feature__content__right">
				<h3 class="feature__heading">Học tập không giới hạn</h3>
				<p class="feature__paragraph">
					Giải pháp Remote Lab mang lại mô hình học tập không giới hạn, cho phép
					sinh viên kỹ thuật truy cập tài nguyên và thực hành từ bất kỳ đâu. Công nghệ
					kết nối mạnh mẽ giúp sinh viên tham gia vào các bài giảng và thực hành thiết bị
					thí nghiệm mà không cần có mặt tại trường, tiết kiệm thời gian và chi phí.
					Remote Lab cung cấp tài liệu học tập, video hướng dẫn và diễn đàn thảo luận,
					tạo cơ hội giao lưu và chia sẻ kinh nghiệm. Mô hình này nâng cao trải nghiệm
					học tập và phát triển kỹ năng công nghệ, phù hợp với xu hướng giáo dục hiện đại.
				</p>
			</div>
		</div>
	</section>
</template>
