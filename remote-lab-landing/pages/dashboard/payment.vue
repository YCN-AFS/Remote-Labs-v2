<script setup>
	import axios from 'axios';
	import swal from 'sweetalert2';
	import { API_BASE_URL } from "~/config/api.js";

	// head and meta
	useHead({ title: 'Thanh toán khoá học' });
	definePageMeta({ title: 'Thanh toán khoá học', layout: 'dashboard' });

	// table states
	const headers = [
		{ text: 'ID', value: 'id', sortable: true },
		{ text: 'Họ', value: 'firstName', sortable: true },
		{ text: 'Tên', value: 'lastName', sortable: true },
		{ text: 'Email', value: 'email', sortable: true },
		{ text: 'Số điện thoại', value: 'phone', sortable: true },
		{ text: 'Số tiền', value: 'amount', sortable: true },
		{ text: 'Mã đơn hàng', value: 'orderCode', sortable: true },
		{ text: 'Trạng thái', value: 'status', sortable: true },
	];
	const items = ref([]);
	const searchField = ref('orderCode');
	const searchValue = ref('');
	const sortBy = ref('orderCode');
	const sortType = ref('desc');

	// modal states
	const showModalCreate = ref(false);
	const showModalEdit = ref(false);

	// other states
	const categories = ref([]);
	const newItem = ref({ name: '', description: '' });
	const itemSelected = ref(null);

	// methods
	async function fetchItems() {
		try {
			const token = useCookie('access_token').value;
			const header = { headers: { Authorization: `Bearer ${token}` } };
			const url = `${API_BASE_URL}/api/payment`;
			const response = await axios.get(url, header);
			items.value = response.data.data;
		} catch (error) {
			swal.fire('Lỗi', error.message, 'error');
		}
	}

	// hooks
	onBeforeMount(() => {
		fetchItems();
	});
</script>

<template>
	<div class="p-6">
		<!-- datatable search -->
		<div class="pb-3 flex flex-col justify-between gap-3 md:flex-row">
			<div class="flex items-center gap-1.5">
				<span>Tìm kiếm theo</span>
				<select v-model="searchField" class="select select-bordered select-xs">
					<option value="id">ID</option>
					<option value="firstName">Họ</option>
					<option value="lastName">Tên</option>
					<option value="email">Email</option>
					<option value="phone">Số điện thoại</option>
					<option value="amount">Số tiền</option>
					<option value="orderCode">Mã đơn hàng</option>
					<option value="status">Trạng thái</option>
				</select>
			</div>

			<input type="text" v-model="searchValue" placeholder="Tìm kiếm..." class="input input-bordered input-xs">
		</div>

		<!-- datatable user -->
		<EasyDataTable
			class="mb-12"
			:headers="headers" 
			:items="items"
			:search-field="searchField"
			:search-value="searchValue"
			:sort-by="sortBy"
			:sort-type="sortType">
		</EasyDataTable>
	</div>
</template>
