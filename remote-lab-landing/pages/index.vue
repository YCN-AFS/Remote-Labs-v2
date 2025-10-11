<script setup>
	useHead({
		title: 'Remote Lab',
		description: 'Remote Lab is a platform for remote learning and teaching.',
	});
</script>

<template>
	<div class="app">
		<!-- navigation -->
		<LandingNavBar></LandingNavBar>

		<!-- hero -->
		<LandingHero></LandingHero>

		<!-- about -->
		<LandingAbout></LandingAbout>

		<div class="shadow-lg m-3 rounded-md px-6 py-12 bg-white lg:m-6">
			<div class="mx-auto container">
				<!-- features -->
				<LandingFeatures></LandingFeatures>

				<!-- pricing -->
				<LandingPricing class="mt-12"></LandingPricing>

				<!-- form contact -->
				<LandingFormContact class="mt-12"></LandingFormContact>
			</div>
		</div>

		<!-- footer -->
		<div class="p-20"></div>
		<LandingFooter></LandingFooter>
	</div>
</template>

<style scoped>
	.app {
		@apply w-full min-h-screen text-gray-700;
	}
</style>
