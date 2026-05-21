/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { PageElement, AppVariable } from "@/lib/builder-store";
import { executeWorkflow } from "@/lib/workflow-engine";
import { supabase } from "@/lib/supabase";
import { Star, ChevronRight, TrendingUp, TrendingDown, Share2, Twitter, Facebook, Linkedin, Link2, Zap, Shield, Flame, Terminal } from "lucide-react";
import ExamResultLookup from "./templates/ExamResultLookup";
import DataSearch from "./templates/DataSearch";
import SupabaseUploadWidget from "./SupabaseUploadWidget";

interface RendererProps {
  elements: PageElement[];
  variables?: AppVariable[];
  setVariable?: (id: string, value: any) => void;
  userId?: string | null;
  slug?: string;
  username?: string;
  isBuilderMode?: boolean;
}

export default function Renderer({
  elements,
  variables = [],
  setVariable = () => {},
  userId,
  slug,
  username,
  isBuilderMode = false,
}: RendererProps) {
  // State for components that need DB
  const [dataSources, setDataSources] = useState<Record<string, any[]>>({});
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<{ [key: string]: boolean }>({});
  const [formElementsValues, setFormElementsValues] = useState<Record<string, any>>({});

  useEffect(() => {
    // Fetch profile
    const fetchProfile = async () => {
      if (!userId) return;
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!profileError && profileData) {
        setCurrentUserProfile(profileData);
      }
      if (!settingsError && settingsData) {
        setUserSettings(settingsData);
      }
    };
    fetchProfile();

    // Fetch external data for any lists/tables
    const fetchSingleSource = async (tableId: string): Promise<any[]> => {
      try {
        if (tableId === 'site_users') {
          const { data, error } = await supabase
            .from('site_users')
            .select('*')
            .eq('owner_id', userId);
          if (error) throw error;
          return data || [];
        } else if (tableId === 'files') {
          const { data, error } = await supabase
            .from('files')
            .select('*')
            .eq('user_id', userId);
          if (error) throw error;
          if (data) {
            return data.map((f: any) => ({
              ...f,
              title: f.name || (f.url ? f.url.split('/').pop() : 'Unnamed File'),
              name: f.name || (f.url ? f.url.split('/').pop() : 'Unnamed File'),
              image: f.url,
              url: f.url
            }));
          }
          return [];
        } else {
          const { data, error } = await supabase
            .from('records')
            .select('data')
            .eq('table_id', tableId)
            .eq('user_id', userId);
            
          if (error) throw error;
          if (data) {
            return data.map((d: any) => typeof d.data === 'string' ? JSON.parse(d.data) : d.data);
          }
          return [];
        }
      } catch (e) {
        console.error("Error fetching single source:", tableId, e);
        return [];
      }
    };

    const fetchAllData = async () => {
      if (!userId) return;
      const sources: Record<string, any[]> = {};

      for (const el of elements) {
        const eligibleTypes = [
          "list", "simple_list", "card_list", "image_list",
          "masonry_list", "horizontal_list", "custom_list", "table",
          "text", "image", "label"
        ];
        
        const hasPrimarySource = !!el.dataSource?.tableId;
        const hasSecondarySources = Array.isArray(el.dataSources) && el.dataSources.some(ds => !!ds?.tableId);

        if (eligibleTypes.includes(el.type) && (hasPrimarySource || hasSecondarySources)) {
          try {
            const tableIdsToFetch: string[] = [];
            
            if (el.dataSource?.tableId) {
              tableIdsToFetch.push(el.dataSource.tableId);
            }
            if (Array.isArray(el.dataSources)) {
              el.dataSources.forEach((ds) => {
                if (ds?.tableId && !tableIdsToFetch.includes(ds.tableId)) {
                  tableIdsToFetch.push(ds.tableId);
                }
              });
            }

            let combinedRecords: any[] = [];
            for (const tid of tableIdsToFetch) {
              const records = await fetchSingleSource(tid);
              combinedRecords = combinedRecords.concat(records);
            }
            
            sources[el.id] = combinedRecords;
          } catch (e) {
            console.error("Data fetch error for element", el.id, e);
          }
        }
      }
      setDataSources(sources);
    };
    if (!isBuilderMode) {
      fetchAllData();
    }
  }, [elements, userId, isBuilderMode]);

  const triggeredRefs = React.useRef<Set<string>>(new Set());

  const executeElementEvents = React.useCallback(
    async (element: PageElement, trigger: string) => {
      if (isBuilderMode || !element.events) return;
      const ev = element.events.find((e) => e.trigger === trigger);
      if (ev) {
        await executeWorkflow(ev.actions, {
          variables,
          setVariable,
          userId: userId || null,
          pageSlug: slug,
          username,
        });
      }
    },
    [isBuilderMode, variables, setVariable, userId, slug, username],
  );

  useEffect(() => {
    // Execute onLoad events for any components that have them
    if (isBuilderMode) return;
    elements.forEach((el) => {
      if (!triggeredRefs.current.has(el.id)) {
        const hasOnLoad = el.events?.find((e) => e.trigger === "onLoad");
        if (hasOnLoad) {
          triggeredRefs.current.add(el.id);
          executeElementEvents(el, "onLoad");
        }
      }
    });
  }, [elements, isBuilderMode, executeElementEvents]);

  const replaceVariablesInText = (text: string | undefined, localContext: any = {}): string => {
    if (!text || typeof text !== "string") return text || "";
    let result = text;
    
    // Process local context first
    if (localContext && typeof localContext === 'object') {
      const regex = new RegExp(`{{\\s*(?:CurrentItem\\.)?([a-zA-Z0-9_]+(?:\\.[a-zA-Z0-9_]+)*)\\s*}}`, "g");
      result = result.replace(regex, (match, path) => {
        const parts = path.split('.');
        let current: any = localContext;
        for (let i = 0; i < parts.length; i++) {
          if (current == null) break;
          current = current[parts[i]];
        }
        if (current !== undefined && current !== null) {
          if (typeof current === 'object') return JSON.stringify(current);
          return current.toString();
        }
        return match; // Leave it for global variables if not found
      });
    }

    // Then, map simple global variables
    const allVariables = [
        ...variables,
        { name: 'currentUser', defaultValue: currentUserProfile }
    ];
    allVariables.forEach((v) => {
      // Find all matches for this specific variable name with possible dot notation
      const regex = new RegExp(`{{\\s*${v.name}(?:\\.[a-zA-Z0-9_]+)*\\s*}}`, "g");
      result = result.replace(regex, (match) => {
        // Extract the full path, e.g., studentResult.name
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
  };

  const handleFormSubmit = async (e: React.FormEvent, element: PageElement) => {
    e.preventDefault();
    if (isBuilderMode) return;

    if (element.type === "form" || element.type === "blank_form") {
      setIsSubmitting(true);
      setFormSuccess((prev) => ({ ...prev, [element.id]: false }));
      const formData = new FormData(e.target as HTMLFormElement);
      const data: Record<string, any> = {};
      formData.forEach((value, key) => (data[key] = value));

      // 1) Set variables from form data so workflow can use it (e.g. {{seat_number}})
      Object.keys(data).forEach((key) => {
        setVariable(key, data[key]);
      });

      // 2) If it's attached to a DB, save it.
      if (element.dataSource?.tableId && userId) {
        try {
          // Process file uploads first
          const files = Array.from(formData.entries())
            .filter(([_, value]) => value instanceof File);
          
          for (const [key, value] of files) {
              const file = value as File;
              const fileExt = file.name.split('.').pop();
              const fileName = `${Math.random()}.${fileExt}`;
              const { data: storageData, error: storageError } = await supabase.storage
                  .from('userdata')
                  .upload(fileName, file);

              if (storageError) throw storageError;

              const { data: publicUrlData } = supabase.storage
                  .from('userdata')
                  .getPublicUrl(fileName);

              data[key] = publicUrlData.publicUrl;
          }

          const { error } = await supabase
            .from('records')
            .insert({
              table_id: element.dataSource.tableId,
              user_id: userId,
              data: JSON.stringify(data),
            });
            
          if (error) throw error;
          
          setDataSources((prev) => {
             const updated = { ...prev };
             // find any list bound to same tableId
             elements.forEach((el) => {
                if (el.dataSource?.tableId === element.dataSource?.tableId && el.type === 'list') {
                   updated[el.id] = [...(updated[el.id] || []), data];
                }
             })
             return updated;
          });
          
          setFormSuccess((prev) => ({ ...prev, [element.id]: true }));
          (e.target as HTMLFormElement).reset();
        } catch (error: any) {
          console.error("Error submitting form", error);
          const errorMsg = error?.message || "";
          if (errorMsg.includes("records_table_id_fkey") || errorMsg.includes("foreign key")) {
            alert("⚠️ تعذر إرسال البيانات لأن جدول قاعدة البيانات المختار قد تم حذفه أو غير متوفر حالياً. يرجى إعادة ربط هذا النموذج بجدول صحيح من داخل المنشئ.");
          } else {
            alert("⚠️ حدث خطأ أثناء إرسال البيانات: " + errorMsg);
          }
        }
      } else {
        setFormSuccess((prev) => ({ ...prev, [element.id]: true }));
      }

      await executeElementEvents(element, "onSubmit");
      setIsSubmitting(false);
    } else if (
      element.type === "auth_form" &&
      element.content.mode === "signup"
    ) {
      // Signup Logic Mock
      setIsSubmitting(true);
      setFormSuccess((prev) => ({ ...prev, [element.id]: false }));
      const formData = new FormData(e.target as HTMLFormElement);
      try {
        const { data, error } = await supabase
          .from('site_users')
          .insert({
            owner_id: userId,
            email: formData.get("Email") as string,
            password: formData.get("Password") as string,
            name: formData.get("Name") as string || null,
            role: "user",
          })
          .select('id')
          .single();
          
        if (error) throw error;
        
        setFormSuccess((prev) => ({ ...prev, [element.id]: true }));
        setVariable("currentUser", { id: data.id, email: formData.get("Email") });
        (e.target as HTMLFormElement).reset();
        await executeElementEvents(element, "onSubmit");
      } catch (e: any) {
        console.error('Signup error:', e);
        alert(e.message || "An error occurred during signup.");
      }
      setIsSubmitting(false);
    } else if (
      element.type === "auth_form" &&
      element.content.mode === "login"
    ) {
      setIsSubmitting(true);
      setFormSuccess((prev) => ({ ...prev, [element.id]: false }));
      const formData = new FormData(e.target as HTMLFormElement);
      try {
        const { data, error } = await supabase
          .from('site_users')
          .select('id')
          .eq('owner_id', userId)
          .eq('email', formData.get("Email") as string)
          .eq('password', formData.get("Password") as string)
          .limit(1);
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          setFormSuccess((prev) => ({ ...prev, [element.id]: true }));
          await executeElementEvents(element, "onSubmit");
        } else {
          alert("Invalid credentials");
        }
      } catch (e: any) {
        console.error('Login error:', e);
        alert(e.message || "An error occurred during login.");
      }
      setIsSubmitting(false);
    }
  };

  const renderContent = (element: PageElement) => {
    const elStyle = element.style || {};
    const customClass = element.customCss || "";

    const getItemImage = (item: any): string | null => {
      if (!item) return null;
      if (typeof item === 'string') {
        if (item.startsWith('http') || item.includes('.png') || item.includes('.jpg') || item.includes('.jpeg') || item.includes('.gif') || item.includes('.webp') || item.includes('picsum.photos')) {
          return item;
        }
        return null;
      }
      if (typeof item === 'object') {
        if (element.dataMapping?.imageField) {
          const mImg = item[element.dataMapping.imageField];
          if (mImg && typeof mImg === 'string') return mImg;
        }
        const directImage = item.image || item.url || item.avatar || item.photo || item.pic || item.icon;
        if (directImage && typeof directImage === 'string') return directImage;
        
        for (const key of Object.keys(item)) {
          const val = item[key];
          if (typeof val === 'string' && (val.startsWith('http') || val.includes('.png') || val.includes('.jpg') || val.includes('.jpeg') || val.includes('.gif') || val.includes('.webp') || val.includes('picsum.photos'))) {
            return val;
          }
        }
      }
      return null;
    };

    const getItemTitle = (item: any): string => {
      if (!item) return "";
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        if (element.dataMapping?.titleField) {
          const mTitle = item[element.dataMapping.titleField];
          if (mTitle !== undefined && mTitle !== null) return String(mTitle);
        }
        return item.title || item.name || item.heading || item.label || item.Message || Object.values(item)[0] || "";
      }
      return String(item);
    };

    const getItemDescription = (item: any): string => {
      if (!item) return "";
      if (typeof item === 'string') return "";
      if (typeof item === 'object') {
        if (element.dataMapping?.descriptionField) {
          const mDesc = item[element.dataMapping.descriptionField];
          if (mDesc !== undefined && mDesc !== null) return String(mDesc);
        }
        return item.description || item.subtitle || item.desc || Object.values(item)[1] || "";
      }
      return "";
    };

    const handleListClick = async (el: PageElement, item: any) => {
      if (isBuilderMode) return;
      const title = getItemTitle(item);
      const imgUrl = getItemImage(item);
      const desc = getItemDescription(item);
      setVariable("active_chat_name", title || "");
      if (imgUrl) setVariable("active_chat_image", imgUrl);
      if (desc) setVariable("active_chat_desc", desc);
      if ((el.dataSource as any)?.saveToVariable) {
        setVariable((el.dataSource as any).saveToVariable, item);
      }
      await executeElementEvents(el, "onClick");
    };

    // Support running "onLoad" triggers immediately on map if not in builder mode
    // Though it belongs in Effect, for declarative builder simple triggers can be invoked at hydration wrapper

    switch (element.type) {
      case "label":
        const labelLocalContext = dataSources[element.id]?.[0] || {};
        return (
          <label id={element.customId} style={elStyle} className={`block mb-1 ${customClass}`}>
            {replaceVariablesInText(element.content, labelLocalContext)}
          </label>
        );
      case "text":
        const textLocalContext = dataSources[element.id]?.[0] || {};
        return (
          <p id={element.customId} style={elStyle} className={customClass}>
            {replaceVariablesInText(element.content, textLocalContext)}
          </p>
        );
      case "heading":
        return (
          <h2
            id={element.customId}
            style={{ ...elStyle, fontWeight: "bold" }}
            className={customClass}
          >
            {replaceVariablesInText(element.content)}
          </h2>
        );
      case "input":
        return (
          <input
            id={element.customId}
            type={(element.content as any)?.type || "text"}
            placeholder={replaceVariablesInText((element.content as any)?.placeholder || "Enter text...")}
            defaultValue={replaceVariablesInText((element.content as any)?.defaultValue || "")}
            style={elStyle}
            name={(element.content as any)?.name}
            className={`px-3 py-2 border rounded-md w-full ${customClass}`}
            onChange={async (e) => {
               const val = e.target.value;
               setFormElementsValues((prev) => ({ ...prev, [element.id]: val }));
               const varName = (element.content as any)?.saveToVariable;
               if (varName) {
                 setVariable(varName, val);
               }
               await executeElementEvents(element, "onChange");
            }}
          />
        );
      case "image":
        const imgList = dataSources[element.id] || [];
        // Support picking first item if datasource populated
        const imgLocalContext = imgList[0] || {};
        const imgSrc = replaceVariablesInText(element.content, imgLocalContext);
        let finalImgSrc = imgSrc;
        if (imgList.length > 0 && imgSrc === element.content && (element.dataSource?.tableId || (Array.isArray(element.dataSources) && element.dataSources.length > 0))) {
            // Smart lookup: first find key named image, url, src, or href
            const smartKey = Object.keys(imgLocalContext).find(k => ['image', 'url', 'src', 'href', 'file', 'path'].includes(k.toLowerCase()));
            if (smartKey && typeof imgLocalContext[smartKey] === 'string' && imgLocalContext[smartKey].startsWith('http')) {
                finalImgSrc = imgLocalContext[smartKey];
            } else {
                const recordValues = Object.values(imgLocalContext);
                const foundUrl = recordValues.find(v => typeof v === 'string' && v.startsWith('http'));
                if (foundUrl) finalImgSrc = foundUrl as string;
            }
        }
        return (
          <img
            id={element.customId}
            src={finalImgSrc}
            alt=""
            style={elStyle}
            className={`object-cover ${customClass}`}
            draggable={false}
          />
        );
      case "video":
        return (
          <div
            id={element.customId}
            style={{
              ...elStyle,
              pointerEvents: isBuilderMode ? "none" : "auto",
            }}
            className={customClass}
          >
            <iframe
              width="100%"
              height="100%"
              src={element.content}
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
        );
      case "button":
        const buttonLocalContext = dataSources[element.id]?.[0] || {};
        const handleButtonClick = async () => {
          if (isBuilderMode) return;

          const collectGroupId = (element.content as any)?.groupId;
          if (collectGroupId) {
            // Find all input elements that have the same groupId
            const relatedInputs = elements.filter(
              (el) =>
                el.type === "input" &&
                (el.content as any)?.groupId === collectGroupId
            );

            // Collect their names/keys and values
            const collectedData: Record<string, any> = {};
            relatedInputs.forEach((inputEl) => {
              const inputContent = inputEl.content as any;
              const key = inputContent?.name || inputEl.id;
              const val =
                formElementsValues[inputEl.id] !== undefined
                  ? formElementsValues[inputEl.id]
                  : replaceVariablesInText(inputContent?.defaultValue || "");
              collectedData[key] = val;

              // Force set individual variable if input has saveToVariable or name
              const inputVarName = inputContent?.saveToVariable || inputContent?.name;
              if (inputVarName) {
                setVariable(inputVarName, val);
              }
            });

            // If the button has a saveToVariable configured, save the serialized or object form
            const btnVarName = (element.content as any)?.saveToVariable;
            if (btnVarName) {
              setVariable(btnVarName, collectedData);
            }

            // Also set individual properties of the group directly as global variables so they are accessible as {{key}}
            Object.entries(collectedData).forEach(([k, v]) => {
              setVariable(k, v);
            });
          }

          await executeElementEvents(element, "onClick");
        };

        const buttonText =
          typeof element.content === "object"
            ? element.content?.text || ""
            : element.content || "";

        return (
          <button
            id={element.customId}
            className={customClass}
            style={{
              ...elStyle,
              pointerEvents: isBuilderMode ? "none" : "auto",
            }}
            onClick={handleButtonClick}
          >
            {replaceVariablesInText(buttonText, buttonLocalContext)}
          </button>
        );
      case "divider":
        return (
          <div id={element.customId} style={elStyle} className={customClass} />
        );
      case "card":
        return (
          <div
            id={element.customId}
            style={{
              ...elStyle,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            className={customClass}
          >
            {replaceVariablesInText(element.content)}
          </div>
        );
      case "icon":
        return (
          <Star id={element.customId} style={elStyle} className={customClass} />
        );
      case "spacer":
        return (
          <div id={element.customId} style={elStyle} className={customClass} />
        );
      case "section_block":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {element.content}
          </div>
        );
      case "list":
      case "simple_list": {
        const simpleItemsSource =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id]
            : (Array.isArray(element.content) ? element.content : []);
        return (
          <div
            id={element.customId}
            style={elStyle}
            className={`${customClass} flex flex-col gap-2`}
          >
            {simpleItemsSource.map((item: any, i: number) => {
              const imgUrl = getItemImage(item);
              const itemText = getItemTitle(item);
              return (
                <div
                  key={i}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium cursor-pointer"
                  onClick={() => handleListClick(element, item)}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={itemText}
                      className="w-8 h-8 object-cover rounded-full border border-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <span className="text-gray-800">{replaceVariablesInText(itemText)}</span>
                </div>
              );
            })}
          </div>
        );
      }
      case "card_list": {
        const cardItemsSource =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id]
            : (Array.isArray(element.content) ? element.content : []);
        return (
          <div id={element.customId} style={elStyle} className={`${customClass} grid grid-cols-1 sm:grid-cols-2 gap-4`}>
            {cardItemsSource.map((item: any, i: number) => {
              const imgUrl = getItemImage(item);
              const title = getItemTitle(item);
              const desc = getItemDescription(item);
              return (
                <div key={i} className="flex flex-col border rounded-xl overflow-hidden shadow-xs bg-white hover:shadow-md transition-shadow">
                  {imgUrl && (
                    <div className="w-full h-40 overflow-hidden relative border-b">
                      <img src={imgUrl} alt={title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 mb-1">{replaceVariablesInText(title)}</h3>
                      {desc && <p className="text-gray-600 text-xs leading-relaxed">{replaceVariablesInText(desc)}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      case "image_list": {
        const imageItemsSource =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id]
            : (Array.isArray(element.content) ? element.content : []);
        return (
          <div id={element.customId} style={elStyle} className={`${customClass} grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4`}>
            {imageItemsSource.map((item: any, i: number) => {
              const imgUrl = getItemImage(item) || "https://picsum.photos/seed/placeholder/300/200";
              const title = getItemTitle(item);
              return (
                <div key={i} className="flex flex-row gap-3 items-center p-3 border rounded-xl bg-white shadow-xs hover:shadow-sm transition-shadow">
                  <img src={imgUrl} alt={title} className="w-16 h-16 object-cover rounded-lg border flex-shrink-0" />
                  <h3 className="font-semibold text-gray-800 text-xs">{replaceVariablesInText(title)}</h3>
                </div>
              );
            })}
          </div>
        );
      }
      case "masonry_list": {
        const masonryItemsSource =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id]
            : (Array.isArray(element.content) ? element.content : []);
        return (
          <div id={element.customId} style={elStyle} className={`${customClass} columns-2 md:columns-3 gap-4 space-y-4`}>
            {masonryItemsSource.map((item: any, i: number) => {
              const imgUrl = getItemImage(item) || "https://picsum.photos/seed/placeholder/300/400";
              const title = getItemTitle(item);
              return (
                <div key={i} className="break-inside-avoid shadow-xs rounded-xl overflow-hidden bg-white border hover:shadow-md transition-shadow">
                  <img src={imgUrl} alt={title} className="w-full h-auto object-cover max-h-72" />
                  {title && (
                    <div className="p-3 text-xs font-medium text-gray-800 border-t bg-gray-50/50">
                      {replaceVariablesInText(title)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      }
      case "horizontal_list": {
        const horizItemsSource =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id]
            : (Array.isArray(element.content) ? element.content : []);
        const isWhatsappStyle = element.id?.includes("wa_") || 
          (element.content && Array.isArray(element.content) && element.content.some((it: any) => it?.title && it?.image));

        return (
          <div id={element.customId} style={elStyle} className={`${customClass} flex flex-row overflow-x-auto gap-4 pb-3 pt-1 snap-x scrollbar-none`}>
            {horizItemsSource.map((item: any, i: number) => {
              const imgUrl = getItemImage(item);
              const title = getItemTitle(item);

              if (isWhatsappStyle) {
                return (
                  <div 
                    key={i} 
                    className="flex-none flex flex-col items-center gap-1.5 snap-center cursor-pointer group"
                    onClick={() => handleListClick(element, item)}
                  >
                    <div className="relative">
                      {imgUrl ? (
                        <div className="w-14 h-14 rounded-full p-[2px] border-2 border-emerald-500 bg-white transition-transform group-hover:scale-105">
                          <img src={imgUrl} alt={title} className="w-full h-full rounded-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg border-2 border-emerald-500">
                          {String(title).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border border-white rounded-full"></div>
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700 max-w-[76px] truncate text-center transition-colors group-hover:text-emerald-600">
                      {replaceVariablesInText(title)}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className="flex-none snap-center flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer"
                  onClick={() => handleListClick(element, item)}
                >
                  {imgUrl && (
                    <img src={imgUrl} alt={title} className="w-5 h-5 rounded-full object-cover" />
                  )}
                  <span className="text-gray-800">{replaceVariablesInText(title)}</span>
                </div>
              );
            })}
          </div>
        );
      }
      case "custom_list": {
        const customItemsSource =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id]
            : (Array.isArray(element.content) ? element.content : []);
        return (
          <div id={element.customId} style={elStyle} className={`${customClass} flex flex-col gap-3 scale-100`}>
            {customItemsSource.map((item: any, i: number) => {
              const imgUrl = getItemImage(item);
              const title = getItemTitle(item);
              const subtitle = getItemDescription(item);
              return (
                <div 
                  key={i} 
                  className="flex items-center gap-3.5 p-3.5 bg-white border rounded-xl hover:bg-gray-50/80 transition-all hover:shadow-xs cursor-pointer"
                  onClick={() => handleListClick(element, item)}
                >
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={title}
                      className="w-11 h-11 object-cover rounded-xl border border-gray-100 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 flex-shrink-0 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-sm border border-emerald-100">
                      {String(title).charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-right pr-1">
                    <h4 className="font-semibold text-gray-950 truncate text-xs">
                      {replaceVariablesInText(title)}
                    </h4>
                    {subtitle && (
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">
                        {replaceVariablesInText(subtitle)}
                      </p>
                    )}
                  </div>
                  <div className="text-gray-400">
                    <ChevronRight className="w-4 h-4 transform rotate-180" />
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      case "quote":
        return (
          <blockquote
            id={element.customId}
            style={elStyle}
            className={customClass}
          >
            {replaceVariablesInText(element.content)}
          </blockquote>
        );
      case "badge":
        return (
          <span id={element.customId} style={elStyle} className={customClass}>
            {replaceVariablesInText(element.content)}
          </span>
        );
      case "map":
        return (
          <div
            id={element.customId}
            style={{
              ...elStyle,
              pointerEvents: isBuilderMode ? "none" : "auto",
            }}
            className={customClass}
          >
            <iframe
              width="100%"
              height="100%"
              src={element.content}
              frameBorder="0"
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
        );
      case "audio":
        return (
          <div
            id={element.customId}
            style={{
              ...elStyle,
              pointerEvents: isBuilderMode ? "none" : "auto",
            }}
            className={customClass}
          >
            <audio
              controls
              src={element.content}
              style={{ width: "100%" }}
            ></audio>
          </div>
        );
      case "alert":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {replaceVariablesInText(element.content)}
          </div>
        );
      case "accordion":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {(element.content as any[]).map((item, i) => (
              <details
                key={i}
                style={{ borderBottom: "1px solid #eee", padding: "10px" }}
                open={isBuilderMode}
              >
                <summary
                  style={{
                    fontWeight: "bold",
                    cursor: "pointer",
                    pointerEvents: isBuilderMode ? "none" : "auto",
                  }}
                >
                  {replaceVariablesInText(item.title)}
                </summary>
                <div style={{ marginTop: "10px" }}>
                  {replaceVariablesInText(item.content)}
                </div>
              </details>
            ))}
          </div>
        );
      case "pricing":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <h3 style={{ fontSize: "20px", fontWeight: "bold" }}>
              {replaceVariablesInText(element.content?.plan || "")}
            </h3>
            <div style={{ fontSize: "32px", margin: "10px 0" }}>
              {replaceVariablesInText(element.content?.price || "")}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: "20px 0" }}>
              {(element.content?.features || []).map((f: string, i: number) => (
                <li
                  key={i}
                  style={{ padding: "5px 0", borderBottom: "1px solid #eee" }}
                >
                  {replaceVariablesInText(f)}
                </li>
              ))}
            </ul>
            <button
              disabled={isBuilderMode}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: "#3b82f6",
                color: "white",
                borderRadius: "6px",
                pointerEvents: isBuilderMode ? "none" : "auto",
              }}
              onClick={() => executeElementEvents(element, "onClick")}
            >
              Choose Plan
            </button>
          </div>
        );
      case "gallery":
        return (
          <div
            id={element.customId}
            style={{ ...elStyle, gap: "10px", flexWrap: "wrap" }}
            className={customClass}
          >
            {(Array.isArray(element.content) ? element.content : []).map(
              (img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                  loading="lazy"
                />
              ),
            )}
          </div>
        );
      case "form":
      case "auth_form":
        return (
          <form
            id={element.customId}
            style={elStyle}
            className={customClass}
            onSubmit={(e) => handleFormSubmit(e, element)}
          >
            <h3 style={{ fontWeight: "bold", marginBottom: "15px" }}>
              {replaceVariablesInText(element.content?.title || "")}
            </h3>
            {formSuccess[element.id] && (
              <div
                style={{
                  color: "green",
                  padding: "10px",
                  backgroundColor: "#e6fffa",
                  border: "1px solid #38b259",
                  borderRadius: "4px",
                  marginBottom: "15px",
                }}
              >
                Action successful!
              </div>
            )}
            {element.type === "form" && ((element.content as any)?.fields || [
              {name:'Name', type:'text'}, 
              {name:'Email', type:'email'}
            ]).map((field: any, i: number) => (
              <input
                key={i}
                type={field.type}
                name={field.name}
                placeholder={field.name}
                required
                disabled={isBuilderMode}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  pointerEvents: isBuilderMode ? "none" : "auto",
                }}
              />
            ))}
            {element.type === "auth_form" && ((element.content as any)?.fields || [
              {name:'Name', type:'text'}, 
              {name:'Email', type:'email'}, 
              {name:'Password', type:'password'}
            ]).map((field: any, i: number) => (
              <input
                key={i}
                type={field.type}
                name={field.name}
                placeholder={field.name}
                required
                disabled={isBuilderMode}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginBottom: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  pointerEvents: isBuilderMode ? "none" : "auto",
                }}
              />
            ))}
            <button
              type="submit"
              disabled={isSubmitting || isBuilderMode}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: isSubmitting ? "#9ca3af" : "#3b82f6",
                color: "white",
                borderRadius: "4px",
                pointerEvents: isBuilderMode ? "none" : "auto",
              }}
            >
              {isSubmitting
                ? "..."
                : replaceVariablesInText(
                    element.content?.buttonText || "Submit",
                  )}
            </button>
          </form>
        );
      case "blank_form":
        return (
          <form
            id={element.customId}
            style={elStyle}
            className={`${customClass} min-h-[100px] flex flex-col`}
            onSubmit={(e) => handleFormSubmit(e, element)}
          >
            {element.content?.title && (
              <h3 className="font-bold mb-3">
                {replaceVariablesInText(element.content.title)}
              </h3>
            )}
            {formSuccess[element.id] && (
              <div
                style={{
                  color: "green",
                  padding: "10px",
                  backgroundColor: "#e6fffa",
                  border: "1px solid #38b259",
                  borderRadius: "4px",
                  marginBottom: "15px",
                }}
              >
                Action successful!
              </div>
            )}
            
            {/* Display helper block for builders */}
            {isBuilderMode && (
              <div className="text-xs text-gray-400 border border-dashed rounded p-3 mb-3 text-center">
                أسحب عناصر الإدخال (Inputs, Labels, Buttons) وضعها مباشرة لتصميم نموذج مخصص!
              </div>
            )}
            
            {element.content?.buttonText && (
              <button
                type="submit"
                disabled={isSubmitting || isBuilderMode}
                className="mt-auto w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                style={{ pointerEvents: isBuilderMode ? "none" : "auto" }}
              >
                {isSubmitting ? "..." : replaceVariablesInText(element.content.buttonText)}
              </button>
            )}
          </form>
        );
      case "exam_result_lookup":
        return (
          <ExamResultLookup tableId={element.dataSource?.tableId || ''} />
        );
      case "search":
        return (
          <div id={element.customId} style={elStyle} className={`${customClass} bg-white shadow-xl min-h-[400px] border border-zinc-200 rounded-xl overflow-hidden`}>
            <DataSearch tableId={element.dataSource?.tableId || ''} placeholder={element.content?.placeholder || 'Search by any field...'} />
          </div>
        );
      case "table":
        return (
          <table
            id={element.customId}
            style={{ ...elStyle, borderCollapse: "collapse" }}
            className={customClass}
          >
            <thead>
              <tr>
                {(element.content?.headers || []).map(
                  (h: string, i: number) => (
                    <th
                      key={i}
                      style={{
                        border: "1px solid #eee",
                        padding: "8px",
                        backgroundColor: "#f9fafb",
                      }}
                    >
                      {replaceVariablesInText(h)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {(dataSources[element.id]
                ? dataSources[element.id].map((r) => Object.values(r))
                : element.content?.rows || []
              ).map((row: any[], i: number) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{ border: "1px solid #eee", padding: "8px" }}
                    >
                      {replaceVariablesInText(String(cell))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      case "code":
        return (
          <div
            id={element.customId}
            style={elStyle}
            className={customClass}
            dangerouslySetInnerHTML={{ __html: element.content }}
          />
        );
      case "loading_screen":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {element.content?.showSpinner && (
              <div className="animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 w-16 h-16 mb-4"></div>
            )}
            <h1 className="text-2xl font-bold text-gray-800">
              {replaceVariablesInText(element.content?.message || "Loading...")}
            </h1>
          </div>
        );
      case "nav_bar":
        return (
          <nav id={element.customId} style={elStyle} className={customClass}>
            {(element.content?.links || []).map((link: any, i: number) => {
              let finalUrl = link.url;
              if (finalUrl && !finalUrl.startsWith('http')) {
                // If the URL is a relative path like 'about' or '/about'
                // We should make sure it directs to the correct path under the user's site
                const cleanPath = finalUrl.replace(/^\/+/, '');
                if (username && slug) {
                  finalUrl = `/${username}/${slug}/${cleanPath}`;
                } else if (username) {
                  finalUrl = `/${username}/${cleanPath}`;
                } else if (finalUrl.startsWith('/')) {
                   // Leave it as is for custom domains
                } else {
                   finalUrl = `/${cleanPath}`;
                }
              }
              return (
              <a
                href={finalUrl}
                key={i}
                onClick={(e) => {
                  if (isBuilderMode) e.preventDefault();
                }}
                style={{
                  textDecoration: "none",
                  color: "#3b82f6",
                  cursor: isBuilderMode ? "default" : "pointer",
                  fontWeight: "medium",
                }}
              >
                {replaceVariablesInText(link.label)}
              </a>
            )})}
          </nav>
        );
      case "product_card":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <img
              src={element.content?.image}
              alt=""
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "4px",
                marginBottom: "12px",
              }}
            />
            <h3
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "8px",
              }}
            >
              {replaceVariablesInText(element.content?.name)}
            </h3>
            <div
              style={{
                color: "#10b981",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              {replaceVariablesInText(element.content?.price)}
            </div>
            <button
              disabled={isBuilderMode}
              onClick={() => executeElementEvents(element, "onClick")}
              style={{
                width: "100%",
                padding: "8px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                pointerEvents: isBuilderMode ? "none" : "auto",
              }}
            >
              {element.content?.buttonText}
            </button>
          </div>
        );
      case "blog_card":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <img
              src={element.content?.image}
              alt=""
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover",
                borderRadius: "4px",
                marginBottom: "12px",
              }}
            />
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                marginBottom: "4px",
              }}
            >
              {element.content?.date} • {element.content?.author}
            </div>
            <h3
              style={{
                fontWeight: "bold",
                fontSize: "18px",
                marginBottom: "8px",
              }}
            >
              {replaceVariablesInText(element.content?.title)}
            </h3>
            <p style={{ fontSize: "14px", color: "#4b5563" }}>
              {replaceVariablesInText(element.content?.excerpt)}
            </p>
          </div>
        );
      case "stats_grid":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {(element.content || []).map((stat: any, i: number) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  padding: "16px",
                  background: "#f9fafb",
                  borderRadius: "8px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: "#3b82f6",
                  }}
                >
                  {replaceVariablesInText(stat.value)}
                </div>
                <div style={{ fontSize: "14px", color: "#6b7280" }}>
                  {replaceVariablesInText(stat.label)}
                </div>
              </div>
            ))}
          </div>
        );
      case "timeline":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {(element.content || []).map((item: any, i: number) => (
              <div
                key={i}
                style={{ marginBottom: "16px", position: "relative" }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "-21px",
                    top: "4px",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#3b82f6",
                  }}
                ></div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#3b82f6",
                  }}
                >
                  {item.date}
                </div>
                <div style={{ fontWeight: "bold", margin: "4px 0" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: "14px", color: "#4b5563" }}>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        );
      case "carousel":
        return (
          <div
            id={element.customId}
            className={`${customClass} hidden-scrollbar`}
            style={{ ...elStyle, scrollSnapType: "x mandatory" }}
          >
            {(Array.isArray(element.content) ? element.content : []).map(
              (img, i) => (
                <img
                  key={i}
                  src={img}
                  alt=""
                  style={{
                    height: "100%",
                    flexShrink: 0,
                    objectFit: "cover",
                    scrollSnapAlign: "start",
                    marginRight: "8px",
                    borderRadius: "8px",
                  }}
                />
              ),
            )}
          </div>
        );
      case "date_picker":
        return (
          <input
            type="date"
            id={element.customId}
            style={elStyle}
            className={customClass}
            value={element.content?.value}
            disabled={isBuilderMode}
          />
        );
      case "file_upload":
        return (
          <div className="flex flex-col gap-2">
            {element.content?.label && (
              <label className="text-xs font-medium text-zinc-700 block">
                {element.content.label}
              </label>
            )}
            <SupabaseUploadWidget
              buttonText={element.content?.buttonText || "Upload File"}
              className={customClass}
              onSuccess={async (url, file) => {
                let targetUserId: string | null = userId || null;
                if (!targetUserId) {
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) targetUserId = user.id;
                }

                // Pre-emptively validate targetUserId as a UUID format
                const simpleUuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                if (targetUserId && !simpleUuidRegex.test(targetUserId)) {
                  targetUserId = null;
                }

                let insertError: any = null;
                const dbTableId = element.dataSource?.tableId;
                let fallbackUsed = false;
                let isA_Processed = false;

                if (dbTableId && dbTableId !== "files") {
                  // Validate tableId format (must be UUID) and existence in 'tables' table
                  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(dbTableId);
                  let tableExists = false;
                  
                  if (isUuid) {
                    const { data } = await supabase
                      .from('tables')
                      .select('id')
                      .eq('id', dbTableId)
                      .maybeSingle();
                    if (data) {
                      tableExists = true;
                    }
                  }

                  if (tableExists) {
                    // Scenario A: Custom dynamic user collection
                    const fieldName = element.dataSource?.fieldName || "url";
                    const recordData = {
                      [fieldName]: url,
                      name: file.name,
                      size: file.size,
                      type: file.type,
                      uploaded_at: new Date().toISOString()
                    };

                    const { error } = await supabase
                      .from('records')
                      .insert({
                        table_id: dbTableId,
                        user_id: targetUserId,
                        data: JSON.stringify(recordData),
                      });

                    if (error) {
                      console.error("Scenario A insert error:", error);
                      // In case of error (e.g. permission or something else), do fallback to Scenario B
                      fallbackUsed = true;
                    } else {
                      isA_Processed = true;
                      // Update any list state connected to this table id so changes propagate instantly
                      setDataSources((prev) => {
                        const updated = { ...prev };
                        elements.forEach((el) => {
                          if (el.dataSource?.tableId === dbTableId) {
                            updated[el.id] = [...(updated[el.id] || []), recordData];
                          }
                          if (Array.isArray(el.dataSources)) {
                            el.dataSources.forEach((ds) => {
                              if (ds?.tableId === dbTableId) {
                                updated[el.id] = [...(updated[el.id] || []), recordData];
                              }
                            });
                          }
                        });
                        return updated;
                      });
                    }
                  } else {
                    fallbackUsed = true;
                  }
                }

                if (!isA_Processed) {
                  // Scenario B: Default scenario - saves to default 'files' table
                  const makeInsert = async (includeName: boolean, includeUserId: boolean) => {
                    const payload: any = { url: url };
                    if (includeName) payload.name = file.name;
                    if (includeUserId && targetUserId) payload.user_id = targetUserId;
                    return await supabase.from('files').insert([payload]);
                  };

                  // Stage 1: Attempt to save with both name and user_id
                  const { error: err1 } = await makeInsert(true, true);
                  insertError = err1;

                  // Stage 2: Mismatch column (PGRST204) - retry without the "name" column
                  if (insertError && (insertError.code === 'PGRST204' || String(insertError.message).toLowerCase().includes('name'))) {
                    console.warn('Retrying saving file metadata without column "name" due to schema cache mismatch...', insertError);
                    const { error: err2 } = await makeInsert(false, true);
                    insertError = err2;
                  }

                  // Stage 3: Foreign Key constraint (23503) - retry with user_id: null
                  if (insertError && (insertError.code === '23503' || String(insertError.message).toLowerCase().includes('foreign key') || String(insertError.message).toLowerCase().includes('user_id'))) {
                    console.warn('Retrying saving file metadata with user_id as null due to auth dependency violation...', insertError);
                    const { error: err3 } = await makeInsert(true, false);
                    insertError = err3;
                  }

                  // Stage 4: Ultimate resilient combination - retry without both name and user_id
                  if (insertError) {
                    console.warn('Ultimate fallback insert for files table: inserting URL only...', insertError);
                    const { error: err4 } = await makeInsert(false, false);
                    insertError = err4;
                  }

                  if (!insertError) {
                    const fallbackFileRecord = {
                      name: file.name,
                      title: file.name,
                      image: url,
                      url: url,
                      size: file.size,
                      type: file.type
                    };
                    setDataSources((prev) => {
                      const updated = { ...prev };
                      elements.forEach((el) => {
                        if (el.dataSource?.tableId === "files") {
                          updated[el.id] = [...(updated[el.id] || []), fallbackFileRecord];
                        }
                      });
                      return updated;
                    });
                  }
                }
                
                if (insertError) {
                    console.error('Error saving file metadata even after all fallbacks:', insertError);
                    alert('تم رفع الملف بنجاح، ولكن تعذر حفظ بياناته في قاعدة البيانات. ' + (insertError.message || ''));
                } else {
                    setVariable(element.id, url);
                    setVariable(element.id + "_url", url);
                    if (fallbackUsed) {
                        alert('تم رفع الملف بنجاح! ولكون جدول قاعدة البيانات المختار قد تم حذفه أو غير متوفر حالياً، فقد تم حفظ رابط الملف تلقائياً في ملفات النظام التلقائية (files) لضمان عدم ضياع المستند المرفوع. يرجى مراجعة رابط جدول البيانات في المنشئ.');
                    } else {
                        alert('تم رفع الملف بنجاح وحفظه في قاعدة البيانات!');
                    }
                    executeElementEvents(element, "onClick");
                }
              }}
            />
          </div>
        );
      case "color_picker":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <input
              type="color"
              defaultValue={element.content?.value}
              disabled={isBuilderMode}
            />
            <span style={{ fontSize: "14px", color: "#374151" }}>
              {element.content?.label}
            </span>
          </div>
        );
      case "qr_code":
        return (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(element.content?.data || "https://example.com")}`}
            alt="QR Code"
            id={element.customId}
            style={elStyle}
            className={customClass}
          />
        );
      case "chat_bubble": {
        const hasDb = dataSources[element.id] && dataSources[element.id].length > 0;
        const messagesSource = hasDb
          ? dataSources[element.id]
          : (Array.isArray(element.content) ? element.content : [element.content || {}]);

        return (
          <div 
            id={element.customId} 
            style={{ 
              ...elStyle, 
              display: "flex", 
              flexDirection: "column", 
              gap: "8px", 
              width: "100%", 
              maxHeight: "500px", 
              overflowY: "auto",
              padding: "10px",
              borderRadius: "8px"
            }} 
            className={`${customClass} scrollbar-none`}
          >
            {messagesSource.map((item: any, i: number) => {
              const isMeVal = item?.isMe === true || item?.isMe === "true" || item?.isMe === "أنا" || !!item?.content?.isMe || (item?.Sender === "أنا") || (item?.Sender === "أنت");
              const senderVal = item?.sender || item?.Sender || item?.content?.sender || (isMeVal ? "أنت" : "أحمد");
              const textVal = item?.text || item?.Message || item?.content?.text || (typeof item === 'string' ? item : "");
              
              if (!textVal) return null;

              const bubbleBg = isMeVal ? "#d9fdd3" : "#ffffff";
              const textColor = "#111b21";

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: isMeVal ? "flex-end" : "flex-start",
                    width: "100%",
                    pointerEvents: "auto",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: bubbleBg,
                      color: textColor,
                      borderRadius: isMeVal ? "12px 12px 0px 12px" : "12px 12px 12px 0px",
                      padding: "8px 12px",
                      maxWidth: "80%",
                      minWidth: "120px",
                      boxShadow: "0 1px 1.5px rgba(0,0,0,0.12)",
                      position: "relative",
                      transition: "all 0.2s ease",
                    }}
                    className="border border-gray-100/30 flex flex-col text-right"
                  >
                    <div
                      style={{
                        fontSize: "10.5px",
                        fontWeight: "bold",
                        color: isMeVal ? "#008069" : "#128c7e",
                        marginBottom: "3px",
                        textAlign: "right"
                      }}
                    >
                      {senderVal}
                    </div>
                    <div 
                      style={{ 
                        fontSize: "13.5px", 
                        lineHeight: "1.4", 
                        color: "#202c33", 
                        textAlign: "right",
                        wordBreak: "break-word"
                      }}
                    >
                      {replaceVariablesInText(textVal)}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        gap: "3.5px",
                        fontSize: "9px",
                        color: "#667781",
                        marginTop: "4px",
                        textAlign: "left"
                      }}
                    >
                      <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMeVal && (
                        <span style={{ color: "#53bdeb" }} className="flex">
                          <svg viewBox="0 0 16 11" width="14" height="10" fill="currentColor">
                            <path d="M15.01 2.41a1 1 0 0 0-1.41 0L5.84 10H1.41a1 1 0 0 0-1.41 1.41 1 1 0 0 0 1.41 1.42h5a1 1 0 0 0 .7-.3L15 3.82a1 1 0 0 0 .01-1.41zM6.84 8.59l1.41-1.41L12.5 2.84a1 1 0 0 0-1.41-1.41L6.84 5.76 5.43 4.34a1 1 0 0 0-1.41 1.41L6.13 8a1 1 0 0 0 .71.59z"/>
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      }
      case "comment_box":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <textarea
              placeholder={element.content?.placeholder}
              disabled={isBuilderMode}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                resize: "vertical",
                minHeight: "60px",
              }}
            ></textarea>
            <button
              disabled={isBuilderMode}
              onClick={() => executeElementEvents(element, "onClick")}
              style={{
                alignSelf: "flex-end",
                padding: "8px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "4px",
                marginTop: "8px",
                pointerEvents: isBuilderMode ? "none" : "auto",
              }}
            >
              {element.content?.buttonText}
            </button>
          </div>
        );
      case "weather":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                textTransform: "uppercase",
              }}
            >
              {replaceVariablesInText(element.content?.city)}
            </div>
            <div
              style={{ fontSize: "32px", fontWeight: "bold", margin: "8px 0" }}
            >
              {replaceVariablesInText(element.content?.temp)}
            </div>
            <div style={{ fontSize: "14px", color: "#3b82f6" }}>
              {replaceVariablesInText(element.content?.condition)}
            </div>
          </div>
        );
      case "stock_ticker":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <span style={{ fontWeight: "bold", marginRight: "8px" }}>
              {replaceVariablesInText(element.content?.symbol)}
            </span>
            <span style={{ marginRight: "8px" }}>
              ${replaceVariablesInText(element.content?.price)}
            </span>
            <span
              style={{
                color: element.content?.change?.startsWith("-")
                  ? "#ef4444"
                  : "#10b981",
              }}
            >
              {replaceVariablesInText(element.content?.change)}
            </span>
          </div>
        );
      case "price_card":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "medium",
                color: "#6b7280",
              }}
            >
              {replaceVariablesInText(element.content?.plan)}
            </h3>
            <div
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                margin: "16px 0",
                color: "#111827",
              }}
            >
              {replaceVariablesInText(element.content?.price)}
            </div>
            <ul
              style={{
                textAlign: "left",
                margin: "0 0 24px 0",
                padding: "0 20px",
                fontSize: "14px",
                color: "#4b5563",
              }}
            >
              {(element.content?.features || []).map((f: string, i: number) => (
                <li key={i} style={{ marginBottom: "8px" }}>
                  ✓ {replaceVariablesInText(f)}
                </li>
              ))}
            </ul>
            <button
              disabled={isBuilderMode}
              onClick={() => executeElementEvents(element, "onClick")}
              style={{
                width: "100%",
                padding: "12px",
                background: "#111827",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontWeight: "medium",
                pointerEvents: isBuilderMode ? "none" : "auto",
              }}
            >
              {element.content?.buttonText}
            </button>
          </div>
        );
      case "map_pin":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            <span style={{ fontSize: "24px", marginBottom: "8px" }}>📍</span>
            <div style={{ fontSize: "14px", fontWeight: "medium" }}>
              {replaceVariablesInText(element.content?.label)}
            </div>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              {element.content?.lat}, {element.content?.lng}
            </div>
          </div>
        );
      case "animated_counter":
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            {element.content?.endValue}
            {element.content?.suffix}
          </div>
        );
      case "tooltip_text":
        return (
          <span
            id={element.customId}
            style={elStyle}
            className={customClass}
            title={element.content?.tooltip}
          >
            {replaceVariablesInText(element.content?.text)}
          </span>
        );
      case "dropdown_menu":
        return (
          <select
            id={element.customId}
            style={elStyle}
            className={customClass}
            disabled={isBuilderMode}
            onChange={() => executeElementEvents(element, "onClick")}
          >
            <option disabled selected>
              {element.content?.label}
            </option>
            {(element.content?.options || []).map((opt: string, i: number) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "range_slider":
        return (
          <div
            id={element.customId}
            style={{
              ...elStyle,
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
            className={customClass}
          >
            <label style={{ fontSize: "12px", color: "#6b7280" }}>
              {element.content?.label}
            </label>
            <input
              type="range"
              min={element.content?.min}
              max={element.content?.max}
              defaultValue={element.content?.value}
              disabled={isBuilderMode}
            />
          </div>
        );
      case "bento_grid": {
        const title = replaceVariablesInText(element.content?.title || "Key Features");
        const subtitle = replaceVariablesInText(element.content?.subtitle || "");
        const items = element.content?.items || [];
        
        return (
          <div id={element.customId} style={elStyle} className={`${customClass} w-full`}>
            {title && (
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.map((item: any) => {
                let IconComponent = Terminal;
                if (item.badge === "Live") IconComponent = Zap;
                else if (item.badge === "Secure") IconComponent = Shield;
                else if (item.badge === "Fast") IconComponent = Flame;
                
                const colSpanClass = item.size === "lg" 
                  ? "md:col-span-3 lg:col-span-2" 
                  : item.size === "md" 
                    ? "md:col-span-2 lg:col-span-1" 
                    : "md:col-span-1";

                return (
                  <div 
                    key={item.id} 
                    className={`flex flex-col justify-between p-5 rounded-xl border border-gray-100 bg-white shadow-xs hover:shadow-md transition duration-300 ${colSpanClass}`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className="p-2 rounded-lg text-white" 
                          style={{ backgroundColor: item.color || "#3b82f6" }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>
                        {item.badge && (
                          <span 
                            className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: `${item.color || "#3b82f6"}20`, color: item.color || "#3b82f6" }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-gray-800 text-base">{replaceVariablesInText(item.title)}</h4>
                      <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{replaceVariablesInText(item.description)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case "trend_stat": {
        const label = replaceVariablesInText(element.content?.label || "");
        const value = replaceVariablesInText(element.content?.value || "0");
        const change = replaceVariablesInText(element.content?.change || "0%");
        const isPositive = element.content?.isPositive !== false;
        const timeframe = replaceVariablesInText(element.content?.timeframe || "");

        return (
          <div id={element.customId} style={elStyle} className={`${customClass} flex flex-col justify-between`}>
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
              <h3 className="text-3xl font-extrabold text-gray-900 mt-1.5 font-sans tracking-tight">{value}</h3>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${isPositive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {isPositive ? <TrendingUp className="w-3.5 h-3.5 mr-1" /> : <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                  {change}
                </span>
                <span className="text-2xs text-gray-400">{timeframe}</span>
              </div>
              <div className="mt-4 pt-1 h-8 w-full overflow-hidden">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path
                    d={isPositive ? "M0 15 Q25 5, 50 12 T100 2" : "M0 2 Q25 15, 50 8 T100 18"}
                    fill="none"
                    stroke={isPositive ? "#10b981" : "#f43f5e"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      }
      case "social_share": {
        const title = replaceVariablesInText(element.content?.title || "Share this page");
        const platforms = element.content?.platforms || ["twitter", "facebook", "whatsapp", "linkedin", "copy"];
        
        const handleShare = (platform: string) => {
          if (typeof window === "undefined") return;
          const url = window.location.href;
          const text = encodeURIComponent("Check out this page!");
          
          if (platform === "twitter") {
            window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`, "_blank");
          } else if (platform === "facebook") {
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
          } else if (platform === "whatsapp") {
            window.open(`https://api.whatsapp.com/send?text=${text}%20${encodeURIComponent(url)}`, "_blank");
          } else if (platform === "linkedin") {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank");
          } else if (platform === "copy") {
            navigator.clipboard.writeText(url);
            alert("Copied directly to clipboard!");
          }
        };

        return (
          <div id={element.customId} style={elStyle} className={`${customClass} flex flex-col items-center gap-2`}>
            {title && <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{title}</span>}
            <div className="flex gap-2.5">
              {platforms.map((p: string) => {
                let BtnIcon = Share2;
                let bgClass = "bg-gray-100 hover:bg-gray-200 text-gray-700";
                
                if (p === "twitter") {
                  BtnIcon = Twitter;
                  bgClass = "bg-sky-500 hover:bg-sky-600 text-white";
                } else if (p === "facebook") {
                  BtnIcon = Facebook;
                  bgClass = "bg-blue-600 hover:bg-blue-700 text-white";
                } else if (p === "whatsapp") {
                  BtnIcon = Zap;
                  bgClass = "bg-emerald-500 hover:bg-emerald-600 text-white";
                } else if (p === "linkedin") {
                  BtnIcon = Linkedin;
                  bgClass = "bg-blue-700 hover:bg-blue-800 text-white";
                } else if (p === "copy") {
                  BtnIcon = Link2;
                  bgClass = "bg-zinc-800 hover:bg-zinc-900 text-white";
                }

                return (
                  <button
                    key={p}
                    onClick={() => handleShare(p)}
                    className={`p-2.5 rounded-full transition-transform hover:scale-110 active:scale-95 shadow-sm flex items-center justify-center ${bgClass}`}
                    title={`Share on ${p}`}
                  >
                    <BtnIcon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>
        );
      }
      case "circular_progress": {
        const label = replaceVariablesInText(element.content?.label || "");
        const percentage = Math.min(Math.max(Number(element.content?.percentage) || 0, 0), 100);
        const strokeColor = element.content?.strokeColor || "#3b82f6";
        const trackColor = element.content?.trackColor || "#e5e7eb";
        const size = Number(element.content?.size) || 120;
        const strokeWidth = Number(element.content?.strokeWidth) || 8;
        
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
          <div id={element.customId} style={elStyle} className={`${customClass} flex flex-col items-center justify-center`}>
            <div className="relative" style={{ width: size, height: size }}>
              <svg className="transform -rotate-90 w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={trackColor}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-xl font-extrabold text-gray-800">{percentage}%</span>
              </div>
            </div>
            {label && <span className="text-xs font-medium text-gray-500 mt-2.5 uppercase tracking-wider">{label}</span>}
          </div>
        );
      }
      case "dynamic_tabs": {
        const tabs = element.content?.tabs || [];
        const variableName = element.content?.variableName || "active_tab";
        const matchedVar = variables?.find((v) => v.name === variableName);
        const currentActiveVal = matchedVar ? matchedVar.defaultValue : "content_a";

        return (
          <div id={element.customId} style={elStyle} className={`${customClass} border-b border-gray-100 flex gap-2 overflow-x-auto`}>
            {tabs.map((tab: any) => {
              const isActive = currentActiveVal === tab.value || element.content?.activeTab === tab.label;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (setVariable && tab.value) {
                      setVariable(variableName, tab.value);
                    }
                    element.content.activeTab = tab.label;
                  }}
                  className={`py-2 px-4 text-xs font-semibold rounded-t-lg border-b-2 transition-all ${
                    isActive 
                      ? "border-blue-500 text-blue-600 bg-blue-50/50" 
                      : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {replaceVariablesInText(tab.label)}
                </button>
              );
            })}
          </div>
        );
      }
      default:
        // Basic fallback for simple text/html replacements not explicitly covered above
        if (
          element.content &&
          typeof element.content === "object" &&
          "text" in element.content
        ) {
          return (
            <div id={element.customId} style={elStyle} className={customClass}>
              {replaceVariablesInText(element.content.text)}
            </div>
          );
        }
        if (typeof element.content === "string") {
          return (
            <div id={element.customId} style={elStyle} className={customClass}>
              {replaceVariablesInText(element.content)}
            </div>
          );
        }
        return (
          <div id={element.customId} style={elStyle} className={customClass}>
            [Plugin: {element.type}]
          </div>
        );
    }
  };

  const renderContentRef = React.useRef(renderContent);
  useEffect(() => {
    renderContentRef.current = renderContent;
  });

  // Sort elements by Y position for logical mobile flow stacking order
  const sortedElements = isBuilderMode 
    ? elements 
    : [...elements].sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .element-container {
            position: relative !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            margin-bottom: 20px !important;
            box-sizing: border-box !important;
            display: block !important;
          }
        }
      `}</style>
      {sortedElements.map((el) => {
        return (
          <MemoizedElement
            key={el.id}
            el={el}
            isBuilderMode={isBuilderMode}
            dataSourceStr={JSON.stringify(dataSources[el.id] || null)}
            isSubmittingStr={String(isSubmitting)}
            formSuccessStr={String(formSuccess[el.id] || false)}
            variableStr={JSON.stringify(variables)}
            renderContent={renderContent}
          />
        );
      })}
    </>
  );
}

const MemoizedElement = React.memo(
  ({
    el,
    isBuilderMode,
    renderContent,
  }: {
    el: PageElement;
    isBuilderMode: boolean;
    dataSourceStr: string;
    isSubmittingStr: string;
    formSuccessStr: string;
    variableStr: string;
    renderContent: (el: PageElement) => React.ReactNode;
  }) => {
    const content = renderContent(el);
    if (isBuilderMode) {
      return <React.Fragment>{content}</React.Fragment>;
    }
    return (
      <div
        style={{
          position: "absolute",
          left: el.position.x,
          top: el.position.y,
        }}
        className="element-container"
      >
        {content}
      </div>
    );
  },
  (prev, next) => {
    return (
      prev.el === next.el &&
      prev.isBuilderMode === next.isBuilderMode &&
      prev.dataSourceStr === next.dataSourceStr &&
      prev.isSubmittingStr === next.isSubmittingStr &&
      prev.formSuccessStr === next.formSuccessStr &&
      prev.variableStr === next.variableStr
    );
  }
);
MemoizedElement.displayName = "MemoizedElement";
