/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { PageElement, AppVariable } from "@/lib/builder-store";
import { executeWorkflow } from "@/lib/workflow-engine";
import { supabase } from "@/lib/supabase";
import { Star } from "lucide-react";
import ExamResultLookup from "./templates/ExamResultLookup";
import DataSearch from "./templates/DataSearch";
import CloudinaryUploadWidget from "./CloudinaryUploadWidget";

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
  const [formSuccess, setFormSuccess] = useState<{ [key: string]: boolean }>(
    {},
  );

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
        .single();

      if (!profileError && profileData) {
        setCurrentUserProfile(profileData);
      }
      if (!settingsError && settingsData) {
        setUserSettings(settingsData);
      }
    };
    fetchProfile();

    // Fetch external data for any lists/tables
    const fetchAllData = async () => {
      if (!userId) return;
      const sources: Record<string, any[]> = {};

      for (const el of elements) {
        if (
          el.dataSource?.tableId &&
          (el.type === "list" || el.type === "table" || el.type === "text" || el.type === "image" || el.type === "label")
        ) {
          try {
            if (el.dataSource.tableId === 'site_users') {
                const { data, error } = await supabase
                  .from('site_users')
                  .select('*')
                  .eq('owner_id', userId);
                if (error) throw error;
                if (data) {
                  sources[el.id] = data;
                }
            } else {
                const { data, error } = await supabase
                  .from('records')
                  .select('data')
                  .eq('table_id', el.dataSource.tableId)
                  .eq('user_id', userId);
                  
                if (error) throw error;
                if (data) {
                  sources[el.id] = data.map((d: any) => typeof d.data === 'string' ? JSON.parse(d.data) : d.data);
                }
            }
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

    if (element.type === "form") {
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
        } catch (error) {
          console.error("Error submitting form", error);
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
               const varName = (element.content as any)?.saveToVariable;
               if (varName) {
                 setVariable(varName, e.target.value);
               }
               await executeElementEvents(element, "onChange");
            }}
          />
        );
      case "image":
        const imgLocalContext = dataSources[element.id]?.[0] || {};
        const imgSrc = replaceVariablesInText(element.content, imgLocalContext);
        let finalImgSrc = imgSrc;
        if (dataSources[element.id]?.[0] && imgSrc === element.content && element.dataSource?.tableId) {
            const recordValues = Object.values(imgLocalContext);
            const foundUrl = recordValues.find(v => typeof v === 'string' && v.startsWith('http'));
            if (foundUrl) finalImgSrc = foundUrl as string;
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
        return (
          <button
            id={element.customId}
            className={customClass}
            style={{
              ...elStyle,
              pointerEvents: isBuilderMode ? "none" : "auto",
            }}
            onClick={() => executeElementEvents(element, "onClick")}
          >
            {replaceVariablesInText(element.content)}
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
        const listData =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id].map((r) => r.Message || Object.values(r).join(" - "))
            : element.content;
        return (
          <ul
            id={element.customId}
            style={{
              ...elStyle,
              listStyleType: elStyle.listStyleType || "disc",
              paddingLeft: elStyle.listStyleType === "none" ? "0px" : "20px",
              pointerEvents: isBuilderMode ? "none" : "auto",
            }}
            className={customClass}
          >
            {(Array.isArray(listData) ? listData : []).map(
              (item: any, i: number) => (
                <li key={i} style={elStyle.listStyleType === 'none' ? { backgroundColor: '#dcf8c6', padding: '10px 15px', borderRadius: '15px', marginBottom: '8px', maxWidth: '80%', wordWrap: 'break-word', boxShadow: '0 1px 1px rgba(0,0,0,0.1)' } : {}}>
                  {replaceVariablesInText(String(item))}
                </li>
              ),
            )}
          </ul>
        );
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
          <CloudinaryUploadWidget
            cloudName={userSettings?.settings?.cloudinaryCloudName}
            uploadPreset={userSettings?.settings?.cloudinaryUploadPreset}
            buttonText="Upload File"
            className={customClass}
            onSuccess={async (url) => {
              // Ensure we have a target userId to save the file to (either the app owner's userId prop or currently logged in user)
              let targetUserId = userId;
              if (!targetUserId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) targetUserId = user.id;
              }

              if (!targetUserId) {
                alert('App owner ID not found. Cannot save file metadata.');
                return;
              }

              const { error: insertError } = await supabase.from('files').insert({
                name: 'Uploaded File via Form',
                url: url,
                user_id: targetUserId
              });
              
              if (insertError) {
                  console.error('Error saving file metadata:', insertError);
                  alert('File uploaded to Cloudinary, but failed to save metadata to dashboard (Schema cache error or permissions). ' + insertError.message);
              } else {
                  alert('File uploaded successfully!');
                  executeElementEvents(element, "onClick");
              }
            }}
          />
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
      case "chat_bubble":
        return (
          <div
            id={element.customId}
            style={{
              ...elStyle,
              marginLeft: element.content?.isMe ? "auto" : "0",
              backgroundColor: element.content?.isMe ? "#3b82f6" : "#f3f4f6",
              color: element.content?.isMe ? "white" : "inherit",
            }}
            className={customClass}
          >
            <div
              style={{ fontSize: "11px", opacity: 0.7, marginBottom: "4px" }}
            >
              {element.content?.sender}
            </div>
            <div style={{ fontSize: "14px" }}>
              {replaceVariablesInText(element.content?.text)}
            </div>
          </div>
        );
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

  return (
    <>
      {elements.map((el) => {
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
