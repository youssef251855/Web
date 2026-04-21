import { ActionStep, AppVariable } from './builder-store';
import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where } from 'firebase/firestore';

export const executeWorkflow = async (
  actions: ActionStep[], 
  context: {
    variables: AppVariable[];
    setVariable: (id: string, value: any) => void;
    userId: string | null;
    pageSlug?: string;
    username?: string;
  }
) => {
  for (const step of actions) {
    // 1. Check conditions
    if (step.conditions && step.conditions.length > 0) {
      let pass = true;
      for (const cond of step.conditions) {
        // Resolve variable if needed (if leftValue starts with var_ let's evaluate it)
        const resolveValue = (val: string) => {
           if (typeof val === 'string' && val.startsWith('{{') && val.endsWith('}}')) {
              const varName = val.slice(2, -2).trim();
              const found = context.variables.find(v => v.name === varName);
              return found ? found.defaultValue : val;
           }
           return val;
        };

        let leftValue = resolveValue(cond.field);
        let rightValue = resolveValue(cond.value);

        if (cond.operator === '==') pass = String(leftValue) == String(rightValue);
        if (cond.operator === '!=') pass = String(leftValue) != String(rightValue);
        if (cond.operator === '>') pass = Number(leftValue) > Number(rightValue);
        if (cond.operator === '<') pass = Number(leftValue) < Number(rightValue);
        if (!pass) break;
      }
      if (!pass) continue; // Skip this step if conditions fail
    }

    // Resolve payload values recursively if setting database or calling API
    const resolvePayload = (obj: any): any => {
      if (typeof obj === 'string') {
        let result = obj;
        context.variables.forEach(v => {
          const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, 'g');
          result = result.replace(regex, v.defaultValue?.toString() || '');
        });
        return result;
      }
      if (Array.isArray(obj)) return obj.map(resolvePayload);
      if (typeof obj === 'object' && obj !== null) {
        const newObj: any = {};
        for (const [k, v] of Object.entries(obj)) newObj[k] = resolvePayload(v);
        return newObj;
      }
      return obj;
    };

    // 2. Execute Action
    try {
      switch (step.type) {
        case 'navigate_page':
          const targetPage = step.params.pageSlug;
          if (targetPage && context.username) {
            window.location.href = `/${context.username}/${targetPage}`;
          }
          break;
        case 'navigate_url':
          if (step.params.url) {
            window.open(step.params.url, step.params.newTab ? '_blank' : '_self');
          }
          break;
        case 'navigate_back':
          window.history.back();
          break;
        case 'db_create':
          if (step.params.tableId) {
            await addDoc(collection(db, 'records'), {
              tableId: step.params.tableId,
              userId: context.userId,
              data: JSON.stringify(resolvePayload(step.params.payload || {})),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          break;
        case 'db_update':
          if (step.params.recordId) {
            await updateDoc(doc(db, 'records', step.params.recordId), {
              data: JSON.stringify(resolvePayload(step.params.payload || {})),
              updatedAt: new Date()
            });
          }
          break;
        case 'db_delete':
          if (step.params.recordId) {
            await deleteDoc(doc(db, 'records', step.params.recordId));
          }
          break;
        case 'api_request':
          const res = await fetch(resolvePayload(step.params.url), {
            method: step.params.method || 'GET',
            headers: resolvePayload(step.params.headers || {}),
            body: step.params.method && step.params.method !== 'GET' ? JSON.stringify(resolvePayload(step.params.body)) : undefined
          });
          const apiData = await res.json();
          if (step.params.saveToVariableId) {
            context.setVariable(step.params.saveToVariableId, apiData);
          }
          break;
        case 'logic_delay':
          const delayMs = step.params.ms || 1000;
          await new Promise(r => setTimeout(r, delayMs));
          break;
        case 'logic_set_variable':
          if (step.params.variableId && step.params.value !== undefined) {
             context.setVariable(step.params.variableId, resolvePayload(step.params.value));
          }
          break;
        case 'run_js':
          if (step.params.code) {
             const customFunc = new Function('context', step.params.code);
             customFunc(context);
          }
          break;
        // Remaining implemented as needed
        default:
          console.warn('Unhandled action type:', step.type);
      }
    } catch (err) {
      console.error(`Workflow error at step ${step.id} (${step.type}):`, err);
    }
  }
};
