import request from '@/utils/request';

export interface Pet {
  id: number;
  name: string;
  breed: string;
  gender: '弟弟' | '妹妹';
  birthday: string;
  image: string;
  description: string;
  created_at: string;
}

// 获取所有宠物
export const getPetsService = () =>
  request<Pet[]>('GET', '/pets');

// 获取单个宠物
export const getPetService = (petId: number) =>
  request<Pet>('GET', `/pets/${petId}`);

// 添加宠物
export const addPetService = (data: Omit<Pet, 'id' | 'created_at'>) =>
  request<Pet>('POST', '/pets', data);

// 编辑宠物
export const updatePetService = (
  petId: number,
  data: Partial<Omit<Pet, 'id' | 'created_at'>>
) => request<Pet>('PUT', `/pets/${petId}`, data);

// 删除宠物
export const deletePetService = (petId: number) =>
  request<null>('DELETE', `/pets/${petId}`);

