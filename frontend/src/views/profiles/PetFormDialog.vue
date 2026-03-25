<script setup lang="ts">
import { ref, watch, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { petApi, type Pet } from '../../services/api';

const props = defineProps<{ modelValue: boolean; pet?: Pet | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'saved'): void }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, v => { visible.value = v; });
watch(visible, v => emit('update:modelValue', v));

interface PetForm {
  name: string;
  breed: string;
  gender: '弟弟' | '妹妹';
  birthday: string;
  image: string;
  description: string;
}

const form = reactive<PetForm>({ name: '', breed: '', gender: '弟弟', birthday: '', image: '', description: '' });
watch(() => props.pet, p => {
  Object.assign(form, p ?? { name: '', breed: '', gender: '弟弟', birthday: '', image: '', description: '' });
}, { immediate: true });

const isEdit = ref(false);
watch(() => props.pet, p => { isEdit.value = !!p?.id; }, { immediate: true });

const saving = ref(false);
const handleSave = async () => {
  if (!form.name || !form.breed || !form.birthday) { ElMessage.warning('请填写必填信息'); return; }
  saving.value = true;
  try {
    if (isEdit.value && props.pet?.id) {
      await petApi.updatePet(props.pet.id, form);
      ElMessage.success('修改成功');
    } else {
      await petApi.addPet(form);
      ElMessage.success('添加成功');
    }
    emit('saved');
    visible.value = false;
  } catch {
    ElMessage.error('操作失败，请重试');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <el-dialog v-model="visible" :title="isEdit ? '编辑宠物' : '添加宠物'" width="480px" align-center>
    <el-form :model="form" label-position="top" class="pet-form">
      <el-form-item label="名字 *"><el-input v-model="form.name" placeholder="宠物名字" /></el-form-item>
      <el-form-item label="品种 *"><el-input v-model="form.breed" placeholder="品种" /></el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="form.gender">
          <el-radio value="弟弟">弟弟</el-radio>
          <el-radio value="妹妹">妹妹</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="生日 *">
        <el-date-picker v-model="form.birthday" type="date" placeholder="选择生日" value-format="YYYY-MM-DD" style="width:100%" />
      </el-form-item>
      <el-form-item label="头像链接"><el-input v-model="form.image" placeholder="https://..." /></el-form-item>
      <el-form-item label="描述"><el-input v-model="form.description" type="textarea" :rows="3" /></el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <button class="foot-btn cancel" @click="visible = false">取消</button>
        <button class="foot-btn confirm" :disabled="saving" @click="handleSave">
          {{ saving ? '保存中...' : (isEdit ? '保存修改' : '添加宠物') }}
        </button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.pet-form {
  padding: 8px 0;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.foot-btn {
  padding: 10px 28px;
  border-radius: var(--border-radius-pill);
  font-size: 15px;
  font-weight: 800;
  font-family: inherit;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.foot-btn.cancel {
  background: #f5f5f5;
  color: var(--dark-charcoal);
}

.foot-btn.confirm {
  background: var(--dark-charcoal);
  color: #fff;
}

.foot-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
