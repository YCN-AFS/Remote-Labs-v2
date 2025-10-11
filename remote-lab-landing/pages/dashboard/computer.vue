<script setup>
	import axios from 'axios';
	import swal from 'sweetalert2';

	// head and meta
	useHead({ title: 'PC thực hành' });
	definePageMeta({ title: 'PC thực hành', layout: 'dashboard' });

	// table states
	const headers = [
		{ text: 'ID', value: 'id', sortable: true },
		{ text: 'Tên', value: 'name', sortable: true },
		{ text: 'Mô tả', value: 'description' },
		{ text: 'Port RDP', value: 'natPortRdp', sortable: true },
		{ text: 'Port WinRM', value: 'natPortWinRm', sortable: true },
		{ text: 'Trạng thái', value: 'status', sortable: true },
		{ text: 'Ngày tạo', value: 'createdAt', sortable: true },
		{ text: '#', value: 'operation' },
	];
	const items = ref([]);
	const searchField = ref('name');
	const searchValue = ref('');
	const sortBy = ref('name');
	const sortType = ref('desc');

	// modal states
	const showModalCreate = ref(false);
	const showModalEdit = ref(false);

	// other states
	const categories = ref([]);
	const newItem = ref({ name: '', description: '', natPortRdp: 3389, natPortWinRm: 5985 });
	const itemSelected = ref(null);

	const isLoadingApprove = ref(true);
	const isLoadingCreate = ref(false);

	// methods
	async function fetchItems() {
		try {
			const token = useCookie('access_token').value;
			const header = { headers: { Authorization: `Bearer ${token}` } };
			const url = 'https://remote-lab.tr1nh.net/api/computer';
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

	// create computer
	async function createItem() {
		if (isLoadingCreate.value) return;
		isLoadingCreate.value = true;

		const token = useCookie('access_token').value;
		const header = { headers: { Authorization: `Bearer ${token}` } };
		axios
			.post('https://remote-lab.tr1nh.net/api/computer', newItem.value, header)
			.then(res => {
				fetchItems();
				newItem.value = { name: '', description: '', natPortRdp: 3389, natPortWinRm: 5985 };
				document.querySelector('#modal_create').checked = false; // hide modal
			})
			.catch(err => swal.fire('Lỗi', err.message, 'error'));

		isLoadingCreate.value = false;
	}

	async function editItem(item) {
		itemSelected.value = item;
		newItem.value = { ...item };

		document.querySelector('#modal_edit').checked = true;
	}

	async function updateItem() {
		const headers = { 'Authorization': `Bearer ${useCookie('access_token').value}` }
		axios
			.put('https://remote-lab.tr1nh.net/api/computer/' + newItem.value.id, newItem.value, { headers })
			.then(res => {
				fetchItems();
				newItem.value = { name: '', description: '', natPortRdp: 3389, natPortWinRm: 5985 };
				document.querySelector('#modal_edit').checked = false; // hide modal
			})
			.catch(err => swal.fire('Lỗi', err.message, 'error'));
	}

	async function deleteItem(id) {
		swal.fire({
			title: 'Xác nhận',
			text: 'Bạn có chắc chắn muốn xóa?',
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: 'Xóa',
			cancelButtonText: 'Hủy',
		}).then((result) => {
			if (result.isConfirmed) {
			const headers = { 'Authorization': `Bearer ${useCookie('access_token').value}` }
			axios
				.delete('https://remote-lab.tr1nh.net/api/computer/' + id, { headers })
				.then(res => fetchItems())
				.catch(err => swal.fire('Lỗi', err.message, 'error'));
			}
		});
	}
</script>

<template>
	<div class="p-6">
		<!-- datatable search -->
		<div class="pb-3 flex flex-col justify-between gap-3 md:flex-row">
			<div class="flex items-center gap-1.5">
				<span>Tìm kiếm theo</span>
				<select v-model="searchField" class="select select-bordered select-xs">
					<option value="id">ID</option>
					<option value="name">Tên</option>
					<option value="description">Mô tả</option>
					<option value="natPortRdp">Port RDP</option>
					<option value="natPortWinRm">Port WinRM</option>
					<option value="status">Trạng thái</option>
					<option value="createdAt">Ngày tạo</option>
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
			<template #item-createdAt="item">
				<p class="whitespace-nowrap">{{ new Date(item.createdAt).toLocaleString('en-GB') }}</p>
			</template>

			<template #item-operation="item">
				<div class="flex justify-center items-center gap-3 fill-gray-500">
					<button @click="editItem(item)" title="Edit">
						<IconPenToSquare class="size-4" />
					</button>
					<button @click="deleteItem(item.id)" title="Delete">
						<IconTrash class="size-4"/>
					</button>
				</div>
			</template>
		</EasyDataTable>

		<!-- floating action button -->
		<label class="fixed bottom-3 right-3 rounded-lg p-3 aspect-square bg-primary cursor-pointer" for="modal_create">
			<IconPlus class="size-4 fill-white" />
		</label>

		<!-- modal create -->
		<input type="checkbox" id="modal_create" class="hidden peer/modal_create">
		<div class="fixed inset-0 z-50 p-6 hidden justify-center items-center peer-checked/modal_create:flex">
			<label for="modal_create" class="absolute inset-0 bg-black/50"></label>
			<form class="z-10 rounded-lg border p-6 max-w-md w-full flex flex-col gap-6 bg-white" @submit.prevent="createItem">
				<h2 class="text-xl font-bold">Thêm máy tính</h2>
				<div class="flex flex-col gap-1.5">
					<label for="name">Tên</label>
					<input v-model="newItem.name" type="text" id="name" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="description">Mô tả</label>
					<input v-model="newItem.description" type="text" id="description" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="natPortRdp">Port RDP</label>
					<input v-model="newItem.natPortRdp" type="number" id="natPortRdp" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="natPortWinRm">Port WinRM</label>
					<input v-model="newItem.natPortWinRm" type="number" id="natPortWinRm" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex justify-end items-center gap-3">
					<label for="modal_create" class="rounded border px-3 py-2 cursor-pointer bg-white hover:bg-gray-100">Thoát</label>
					<button type="submit" class="rounded px-3 py-2 bg-primary text-white hover:saturate-50">Thêm</button>
				</div>
			</form>
		</div>

		<!-- modal edit -->
		<input type="checkbox" id="modal_edit" class="hidden peer/modal_edit">
		<div class="fixed inset-0 z-50 p-6 hidden justify-center items-center peer-checked/modal_edit:flex">
			<label for="modal_edit" class="absolute inset-0 bg-black/50"></label>
			<form class="z-10 rounded-lg border p-6 max-w-md w-full flex flex-col gap-6 bg-white" @submit.prevent="updateItem">
				<h2 class="text-xl font-bold">Cập nhật thông tin</h2>
				<div class="flex flex-col gap-1.5">
					<label for="name">Tên</label>
					<input v-model="newItem.name" type="text" id="name" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="description">Mô tả</label>
					<input v-model="newItem.description" type="text" id="description" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="natPortRdp">Port RDP</label>
					<input v-model="newItem.natPortRdp" type="number" id="natPortRdp" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex flex-col gap-1.5">
					<label for="natPortWinRm">Port WinRM</label>
					<input v-model="newItem.natPortWinRm" type="number" id="natPortWinRm" class="rounded border px-3 py-2 focus:outline-none focus:ring">
				</div>
				<div class="flex justify-end items-center gap-3">
					<label for="modal_edit" class="rounded border px-3 py-2 cursor-pointer bg-white hover:bg-gray-100">Thoát</label>
					<button type="submit" class="rounded px-3 py-2 bg-primary text-white hover:saturate-50">Cập nhật</button>
				</div>
			</form>
		</div>
	</div>
</template>
