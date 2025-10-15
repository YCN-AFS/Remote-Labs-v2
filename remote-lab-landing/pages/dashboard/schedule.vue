<script setup>
	import axios from 'axios';
	import swal from 'sweetalert2';
	import { API_BASE_URL } from "~/config/api.js";

	// head and meta
	useHead({ title: 'Lịch đăng ký thực hành' });
	definePageMeta({ title: 'Lịch đăng ký thực hành', layout: 'dashboard' });

	// table states
	const headers = [
		{ text: 'ID', value: 'id', sortable: true },
		{ text: 'Email', value: 'email', sortable: true },
		{ text: 'userName', value: 'userName', sortable: true },
		{ text: 'Mật khẩu', value: 'password' },
		{ text: 'Bắt đầu', value: 'startTime', sortable: true },
		{ text: 'Kết thúc', value: 'endTime', sortable: true },
		{ text: 'Trạng thái', value: 'status', sortable: true },
		{ text: '#', value: 'operation' },
	];
	const items = ref([]);
	const searchField = ref('email');
	const searchValue = ref('');
	const sortBy = ref('startTime');
	const sortType = ref('desc');

	// modal states
	const showModalCreate = ref(false);
	const showModalEdit = ref(false);

	// other states
	const categories = ref([]);
	const newItem = ref({ email: '', userName: '', password: '', startTime: '', endTime: '' });
	const itemSelected = ref(null);

	const isLoadingApprove = ref(true);
	const computers = ref([]);
	const computerId = ref(null);

	// methods
	async function fetchItems() {
		try {
			const token = useCookie('access_token').value;
			const header = { headers: { Authorization: `Bearer ${token}` } };
			const url = `${API_BASE_URL}/api/schedule`;
			const response = await axios.get(url, header);
			items.value = response.data.data;
		} catch (error) {
			swal.fire('Lỗi', error.message, 'error');
		}

		try {
			const token = useCookie('access_token').value;
			const header = { headers: { Authorization: `Bearer ${token}` } };
			const url = `${API_BASE_URL}/api/computer`;
			const response = await axios.get(url, header);
			computers.value = response.data.data;
		} catch (error) {
			swal.fire('Lỗi', error.message, 'error');
		}
	}

	async function chooseComputer(id) {
		itemSelected.value = items.value.find(item => item.id == id);
		document.querySelector('#modal_approve').checked = true;
	}

	async function approveItem() {
		try {
			// Validate computerId before proceeding
			if (!computerId.value) {
				swal.fire('Lỗi', 'Vui lòng chọn máy tính để thực hành', 'error');
				return;
			}

			swal.fire({
				title: 'Xác nhận',
				text: 'Bạn có muốn chấp nhận lịch đăng ký này?',
				icon: 'question',
				showCancelButton: true,
				confirmButtonText: 'Chấp nhận',
				cancelButtonText: 'Hủy',
			}).then(async (result) => {
				if (!result.isConfirmed) return;

				swal.fire({
					title: 'Đang xử lý',
					text: 'Vui lòng chờ...',
					allowOutsideClick: false,
					didOpen: () => swal.showLoading()
				});

				try {
					const token = useCookie('access_token').value;
					const header = { headers: { Authorization: `Bearer ${token}` } };
					const id = itemSelected.value.id;
					const url = `${API_BASE_URL}/api/schedule/${id}/approve`;
					const body = { computerId: computerId.value };
					const response = await axios.post(url, body, header);
					
					// Check if response is successful
					if (response.data.status === 'success') {
						fetchItems();
						swal.close();
						swal.fire('Thành công', 'Chấp nhận lịch đăng ký thành công', 'success');
						document.querySelector('#modal_approve').checked = false;
						// Reset computerId after successful approval
						computerId.value = null;
					} else {
						swal.close();
						swal.fire('Lỗi', response.data.message || 'Có lỗi xảy ra', 'error');
					}
				} catch (error) {
					swal.close();
					const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi phê duyệt lịch';
					swal.fire('Lỗi', errorMessage, 'error');
				}
			});
		}
		catch (error) {
			swal.fire({ title: 'Lỗi', text: error.message, icon: 'error' });
		}
	}

	// hooks
	onBeforeMount(() => {
		fetchItems();
	});

	onMounted(() => {
		let source = new EventSource(`${API_BASE_URL}/sse`);
		source.addEventListener('message', message => {
			let data = JSON.parse(message.data);
			if (data.type == 'new-schedule') fetchItems();
		});
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
					<option value="email">Email</option>
					<option value="userName">Tên</option>
					<option value="startTime">Bắt đầu</option>
					<option value="endTime">Kết thúc</option>
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
			<template #item-startTime="item">
				<p class="whitespace-nowrap">{{ new Date(item.startTime).toLocaleString('en-GB') }}</p>
			</template>

			<template #item-endTime="item">
				<p class="whitespace-nowrap">{{ new Date(item.endTime).toLocaleString('en-GB') }}</p>
			</template>

			<template #item-operation="item">
				<div class="flex justify-center items-center gap-3 fill-gray-500">
					<button v-if="item.status == 'approved'" title="Đã chấp nhận" disabled>
						<IconCircleCheck class="size-4 fill-green-500" />
					</button>
					<button v-else title="Chấp nhận lịch đăng ký này" @click="chooseComputer(item.id)">
						<IconCircleCheck class="size-4 fill-gray-400"/>
					</button>
				</div>
			</template>
		</EasyDataTable>

		<!-- modal approve -->
		<input type="checkbox" id="modal_approve" class="hidden peer/modal_approve">
		<div class="fixed inset-0 z-50 p-6 hidden justify-center items-center peer-checked/modal_approve:flex">
			<label for="modal_approve" class="absolute inset-0 bg-black/50"></label>
			<form class="z-10 rounded-lg border p-6 max-w-md w-full flex flex-col gap-6 bg-white" @submit.prevent="approveItem">
				<h2 class="text-xl font-bold">Chọn máy tính để thực hành</h2>
				<div class="flex flex-col gap-3">
					<label for="computer-id">PC thực hành <span class="text-red-500">*</span></label>
					<select name="computer-id" id="computer-id" class="rounded border px-3 py-2" v-model="computerId" required>
						<option value="" disabled>-- Chọn máy tính --</option>
						<option v-for="item in computers" :value="item.id" :disabled="item.status !== 'available'">
							{{ item.name }} {{ item.status !== 'available' ? '(Đang sử dụng)' : '' }}
						</option>
					</select>
				</div>
				<div class="flex justify-end items-center gap-3">
					<label for="modal_approve" class="rounded border px-3 py-2 cursor-pointer bg-white hover:bg-gray-100">Thoát</label>
					<button type="submit" class="rounded px-3 py-2 bg-primary text-white hover:saturate-50">Thêm</button>
				</div>
			</form>
		</div>
	</div>
</template>
