<style scoped>
	.footer {
		@apply relative;
	}
	.footer__title {
		@apply absolute bottom-full -z-10
			p-6 w-full h-[600px] flex justify-center items-end
			bg-[url('~/assets/images/footer.png')] bg-cover bg-center bg-no-repeat text-white;
	}
	.footer__title h2 {
		@apply text-3xl font-bold text-center uppercase lg:text-4xl;
	}
	.footer__content {
		@apply mx-auto p-6 container grid grid-cols-1 gap-6 lg:grid-cols-4;
	}
	.footer__item {
		@apply p-3 flex flex-col gap-3;
	}
	.footer__heading {
		@apply text-xl font-bold;
	}
	.footer__info li {
		@apply flex gap-3;
	}
	.footer__info li svg {
		@apply shrink-0 size-5 fill-primary;
	}
	.footer__info li a {
		@apply text-primary hover:underline;
	}
</style>

<template>
	<footer class="footer" id="footer">
		<div class="footer__title">
			<h2>Remote Lab<br>Thực Hành Từ Xa, Trải Nghiệm Gần Gũi!</h2>
		</div>

		<div class="footer__content">
			<div class="footer__item justify-center items-center">
				<img src="~/assets/images/logo-full.png" alt="brand-logo" class="w-2/3">
			</div>

			<div class="footer__item">
				<h3 class="footer__heading">Trường Đại học Lạc Hồng</h3>
				<ul class="footer__info">
					<li><IconHouse/><span>Địa chỉ: Số 10, Huỳnh Văn Nghệ, Bửu Long, Biên Hòa, ĐN.</span></li>
					<li><IconPhone/><span>Điện thoại: 0251 3952 778</span></li>
					<li><IconEnvelope/><span>Email: lachong@lhu.edu.vn</span></li>
				</ul>
			</div>

			<div class="footer__item">
				<h3 class="footer__heading">Khoa Công nghệ thông tin</h3>
				<ul class="footer__info">
					<li><IconHouse/><span>Địa chỉ: Dãy nhà B - CS1</span></li>
					<li><IconPhone/><span>Điện thoại: (+84)251 3 952 251</span></li>
					<li><IconGlobe/><span><a href="https://cs.lhu.edu.vn/">https://cs.lhu.edu.vn/</a></span></li>
					<li><IconEnvelope/><span>Email: cntt@lhu.edu.vn</span></li>
				</ul>
			</div>

			<div class="footer__item">
				<h3 class="footer__heading">Khoa Cơ điện điện tử</h3>
				<ul class="footer__info">
					<li><IconHouse/><span>Địa chỉ: Phòng I205 – I206, CS6</span></li>
					<li><IconPhone/><span>Điện thoại: (+84)2513 951 937</span></li>
					<li><IconGlobe/><span><a href="https://codien.lhu.edu.vn/">https://codien.lhu.edu.vn/</a></span></li>
					<li><IconEnvelope/><span>Email: codiendientu@lhu.edu.vn</span></li>
				</ul>
			</div>
		</div>

		<div class="p-1.5 bg-gray-600 text-center text-white text-sm">
			<span>Copyright 2024 © lhu.edu.vn</span>
		</div>
	</footer>
</template>
