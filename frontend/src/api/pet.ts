import request from '@/utils/request';
import type { ApiResponse } from './types';

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

export interface PetRoutine {
  id: number;
  pet_id: number;
  task_type: string;
  title: string;
  task_time: string;
  frequency_type: string;
  frequency_value: string;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

export interface RoutineRecord {
  id: number;
  routine_id: number;
  pet_id: number;
  record_date: string;
  completed_at: string;
}

// 获取所有宠物
export const getPetsService = () =>
  request<ApiResponse<Pet[]>>('GET', '/pets');

// 获取单个宠物
export const getPetService = (petId: number) =>
  request<ApiResponse<Pet>>('GET', `/pets/${petId}`);

// 添加宠物
export const addPetService = (data: Omit<Pet, 'id' | 'created_at'>) =>
  request<ApiResponse<Pet>>('POST', '/pets', data);

// 编辑宠物
export const updatePetService = (
  petId: number,
  data: Partial<Omit<Pet, 'id' | 'created_at'>>
) => request<ApiResponse<Pet>>('PUT', `/pets/${petId}`, data);

// 删除宠物
export const deletePetService = (petId: number) =>
  request<ApiResponse<null>>('DELETE', `/pets/${petId}`);

// ======================= 打卡活动相关接口 ======================= //

// 获取宠物打卡活动
export const getRoutinesService = (petId: number, month?: string) => {
  const query = month ? `?month=${month}` : '';
  return request<ApiResponse<PetRoutine[]>>('GET', `/pets/${petId}/routines${query}`);
};

// 添加打卡活动
export const addRoutineService = (petId: number, data: Omit<PetRoutine, 'id' | 'pet_id' | 'created_at'>) =>
  request<ApiResponse<PetRoutine>>('POST', `/pets/${petId}/routines`, data);

// 修改打卡活动
export const updateRoutineService = (petId: number, routineId: number, data: Omit<PetRoutine, 'id' | 'pet_id' | 'created_at'>) =>
  request<ApiResponse<null>>('PUT', `/pets/${petId}/routines/${routineId}`, data);

// 删除打卡活动
export const deleteRoutineService = (petId: number, routineId: number) =>
  request<ApiResponse<null>>('DELETE', `/pets/${petId}/routines/${routineId}`);

// 获取打卡记录
export const getRoutineRecordsService = (petId: number, startDate: string, endDate?: string) => {
  const query = endDate ? `?startDate=${startDate}&endDate=${endDate}` : `?startDate=${startDate}`;
  return request<ApiResponse<RoutineRecord[]>>('GET', `/pets/${petId}/routine-records${query}`);
};

// 切换打卡状态
export const toggleRoutineRecordService = (petId: number, routineId: number, record_date: string, completed: boolean) =>
  request<ApiResponse<null>>('POST', `/pets/${petId}/routines/${routineId}/toggle`, { record_date, completed });

