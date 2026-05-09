import { ActionStep, AppVariable } from './builder-store';
import { supabase } from './supabase';

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
              const path = val.slice(2, -2).trim();
              const parts = path.split('.');
              const varName = parts[0];
              const found = context.variables.find(v => v.name === varName);
              if (!found) return val;
              
              let current: any = found.defaultValue;
              for (let i = 1; i < parts.length; i++) {
                if (current == null) break;
                current = current[parts[i]];
              }
              return current;
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
          const regex = new RegExp(`{{\\s*${v.name}(?:\\.[a-zA-Z0-9_]+)*\\s*}}`, 'g');
          result = result.replace(regex, (match) => {
            const path = match.replace(/[{}]/g, '').trim();
            const parts = path.split('.');
            let current: any = v.defaultValue;
            for (let i = 1; i < parts.length; i++) {
              if (current == null) break;
              current = current[parts[i]];
            }
            if (current === undefined || current === null) return "";
            if (typeof current === 'object') return JSON.stringify(current);
            return current.toString();
          });
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
          } else if (targetPage) {
            window.location.href = `/${targetPage}`;
          }
          break;
        case 'navigate_url':
          if (step.params.url) {
            let finalNavUrl = step.params.url;
            if (!finalNavUrl.startsWith('http') && context.username) {
               const cleanPath = finalNavUrl.replace(/^\/+/, '');
               finalNavUrl = `/${context.username}/${cleanPath}`;
            }

            if (step.params.newTab) {
              window.open(finalNavUrl, '_blank');
            } else {
              window.location.href = finalNavUrl;
            }
          }
          break;
        case 'navigate_back':
          window.history.back();
          break;
        case 'db_create':
          if (step.params.tableId) {
            const { error } = await supabase.from('records').insert({
              table_id: step.params.tableId,
              user_id: context.userId,
              data: JSON.stringify(resolvePayload(step.params.payload || {})),
            });
            if (error) throw error;
          }
          break;
        case 'db_update':
          if (step.params.recordId) {
            const { error } = await supabase.from('records').update({
              data: JSON.stringify(resolvePayload(step.params.payload || {})),
            }).eq('id', step.params.recordId);
            if (error) throw error;
          }
          break;
        case 'db_delete':
          if (step.params.recordId) {
            const { error } = await supabase.from('records').delete().eq('id', step.params.recordId);
            if (error) throw error;
          }
          break;
        case 'db_fetch':
          if (step.params.tableId) {
            let query = supabase.from('records').select('*').eq('table_id', step.params.tableId);
            if (step.params.filterField && step.params.filterValue) {
               const val = resolvePayload(step.params.filterValue);
               query = query.eq(`data->>${step.params.filterField}`, val);
            }
            const { data, error } = await query;
            if (error) throw error;
            if (step.params.saveToVariableId) {
               const parsedData = data.map(d => typeof d.data === 'string' ? JSON.parse(d.data) : d.data);
               if (step.params.single) {
                 context.setVariable(step.params.saveToVariableId, parsedData[0] || null);
               } else {
                 context.setVariable(step.params.saveToVariableId, parsedData);
               }
            }
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
        case 'ui_hide':
          if (step.params.elementId) {
             const el = document.getElementById(step.params.elementId);
             if (el) el.style.setProperty('display', 'none', 'important');
          }
          break;
        case 'ui_show':
          if (step.params.elementId) {
             const el = document.getElementById(step.params.elementId);
             if (el) el.style.setProperty('display', 'block', 'important');
          }
          break;
        case 'ui_set_text':
          if (step.params.elementId && step.params.text !== undefined) {
             const el = document.getElementById(step.params.elementId);
             if (el) el.innerText = resolvePayload(step.params.text);
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
