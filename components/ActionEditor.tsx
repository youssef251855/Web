import React from 'react';
import { PageElement, ActionStep, ActionType } from '@/lib/builder-store';
import { v4 as uuidv4 } from 'uuid';
import { Plus, X, ArrowRight, Database, Globe, Key, File as FileIcon, Code, Shuffle, Palette } from 'lucide-react';

interface ActionEditorProps {
  element: PageElement;
  updateElement: (id: string, updates: Partial<PageElement>) => void;
  userPages: any[];
}

const ACTION_GROUPS: { group: string, icon: any, types: ActionType[] }[] = [
  { group: 'Navigation', icon: ArrowRight, types: ['navigate_page', 'navigate_url', 'navigate_back', 'open_modal', 'close_modal'] },
  { group: 'Database', icon: Database, types: ['db_create', 'db_update', 'db_delete', 'db_fetch'] },
  { group: 'Users', icon: Key, types: ['auth_signup', 'auth_login', 'auth_logout', 'auth_reset'] },
  { group: 'Files', icon: FileIcon, types: ['file_upload', 'file_delete'] },
  { group: 'API', icon: Globe, types: ['api_request'] },
  { group: 'Logic/Workflow', icon: Shuffle, types: ['logic_if', 'logic_delay', 'logic_math', 'logic_set_variable'] },
  { group: 'UI', icon: Palette, types: ['ui_show', 'ui_hide', 'ui_set_text'] },
  { group: 'Advanced', icon: Code, types: ['run_js'] }
];

export default function ActionEditor({ element, updateElement, userPages }: ActionEditorProps) {
  // Ensure element has an onClick event array
  const events = element.events || [];
  const onClickEvent = events.find(e => e.trigger === 'onClick') || { id: uuidv4(), trigger: 'onClick', actions: [] };
  
  const addAction = (type: ActionType) => {
    const newActions = [...onClickEvent.actions, { id: uuidv4(), type, params: {} }];
    updateElementEvents(newActions);
  };

  const removeAction = (index: number) => {
    const newActions = [...onClickEvent.actions];
    newActions.splice(index, 1);
    updateElementEvents(newActions);
  };

  const updateActionParam = (idx: number, key: string, value: any) => {
    const newActions = [...onClickEvent.actions];
    newActions[idx].params[key] = value;
    updateElementEvents(newActions);
  };

  const updateElementEvents = (newActions: ActionStep[]) => {
    const updatedEvent = { ...onClickEvent, actions: newActions };
    const filteredEvents = events.filter(e => e.trigger !== 'onClick');
    updateElement(element.id, { events: [...filteredEvents, updatedEvent] });
  };

  return (
    <div className="space-y-4 mt-4 border-t pt-4">
      <h3 className="text-sm font-medium text-gray-900 border-b pb-2">Workflows (onClick)</h3>
      
      {onClickEvent.actions.length > 0 ? (
        <div className="space-y-3">
          {onClickEvent.actions.map((act, idx) => (
            <div key={act.id} className="p-3 bg-gray-50 border rounded-lg relative group">
              <button 
                onClick={() => removeAction(idx)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={14} />
              </button>
              <div className="text-xs font-semibold text-gray-700 mb-2 uppercase">{act.type.replace('_', ' ')}</div>
              
              {/* Dynamic Param Inputs based on Action Type */}
              {act.type === 'navigate_page' && (
                <select 
                  className="w-full text-xs p-1 border rounded"
                  value={act.params.pageSlug || ''}
                  onChange={(e) => updateActionParam(idx, 'pageSlug', e.target.value)}
                >
                  <option value="">Select a page...</option>
                  {userPages.map(p => <option key={p.id} value={p.slug}>{p.title}</option>)}
                </select>
              )}
              {act.type === 'navigate_url' && (
                <input 
                  type="url" 
                  className="w-full text-xs p-1 border rounded" 
                  placeholder="https://..."
                  value={act.params.url || ''}
                  onChange={(e) => updateActionParam(idx, 'url', e.target.value)}
                />
              )}
              {act.type === 'api_request' && (
                <div className="space-y-2">
                  <select className="w-full text-xs p-1 border rounded" value={act.params.method || 'GET'} onChange={(e) => updateActionParam(idx, 'method', e.target.value)}>
                    <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
                  </select>
                  <input type="url" className="w-full text-xs p-1 border rounded" placeholder="Endpoint URL" value={act.params.url || ''} onChange={(e) => updateActionParam(idx, 'url', e.target.value)} />
                </div>
              )}
              {act.type === 'logic_delay' && (
                <input type="number" className="w-full text-xs p-1 border rounded" placeholder="Delay (ms)" value={act.params.ms || ''} onChange={(e) => updateActionParam(idx, 'ms', Number(e.target.value))} />
              )}
              {act.type === 'logic_set_variable' && (
                <div className="space-y-2">
                  <input type="text" className="w-full text-xs p-1 border rounded" placeholder="Variable Name (e.g. currentUserId)" value={act.params.variableId || ''} onChange={(e) => updateActionParam(idx, 'variableId', e.target.value)} />
                  <input type="text" className="w-full text-xs p-1 border rounded" placeholder="New Value" value={act.params.value || ''} onChange={(e) => updateActionParam(idx, 'value', e.target.value)} />
                </div>
              )}
              {act.type === 'run_js' && (
                <textarea 
                  className="w-full text-xs p-1 border rounded font-mono h-24" 
                  placeholder="context.setVariable('x', 1);"
                  value={act.params.code || ''}
                  onChange={(e) => updateActionParam(idx, 'code', e.target.value)}
                />
              )}
              {/* Add more param configurations generically */}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-500 italic text-center py-2">No actions configured</div>
      )}

      {/* Add Action Selector */}
      <div className="mt-2">
        <select 
          className="w-full px-3 py-2 border rounded-md text-sm bg-blue-50 text-blue-700"
          onChange={(e) => {
            if (e.target.value) {
              addAction(e.target.value as ActionType);
              e.target.value = ''; // Reset select
            }
          }}
          defaultValue=""
        >
          <option value="" disabled>+ Add Action...</option>
          {ACTION_GROUPS.map(group => (
            <optgroup key={group.group} label={group.group}>
              {group.types.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
