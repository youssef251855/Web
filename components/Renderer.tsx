import React, { useState, useEffect } from "react";
import { PageElement, AppVariable } from "@/lib/builder-store";
import { executeWorkflow } from "@/lib/workflow-engine";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Star } from "lucide-react";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<{ [key: string]: boolean }>(
    {},
  );

  useEffect(() => {
    // Fetch external data for any lists/tables
    const fetchAllData = async () => {
      if (!userId) return;
      const sources: Record<string, any[]> = {};

      for (const el of elements) {
        if (
          el.dataSource?.tableId &&
          (el.type === "list" || el.type === "table")
        ) {
          try {
            const q = query(
              collection(db, "records"),
              where("tableId", "==", el.dataSource.tableId),
              where("userId", "==", userId),
              // We can add limits & sorts if they exist in el.dataSource
            );
            const snap = await getDocs(q);
            sources[el.id] = snap.docs.map((d) => JSON.parse(d.data().data));
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
  }, [elements, isBuilderMode, variables, userId, slug, username]);

  const executeElementEvents = async (
    element: PageElement,
    trigger: string,
  ) => {
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
  };

  const replaceVariablesInText = (text: string | undefined): string => {
    if (!text || typeof text !== "string") return text || "";
    let result = text;
    variables.forEach((v) => {
      const regex = new RegExp(`{{\\s*${v.name}\\s*}}`, "g");
      result = result.replace(regex, v.defaultValue?.toString() || "");
    });
    return result;
  };

  const handleFormSubmit = async (e: React.FormEvent, element: PageElement) => {
    e.preventDefault();
    if (isBuilderMode) return;

    if (element.type === "form" && element.dataSource?.tableId && userId) {
      setIsSubmitting(true);
      setFormSuccess((prev) => ({ ...prev, [element.id]: false }));
      const formData = new FormData(e.target as HTMLFormElement);
      const data: Record<string, any> = {};
      formData.forEach((value, key) => (data[key] = value));

      try {
        await addDoc(collection(db, "records"), {
          tableId: element.dataSource.tableId,
          userId,
          data: JSON.stringify(data),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setFormSuccess((prev) => ({ ...prev, [element.id]: true }));
        (e.target as HTMLFormElement).reset();
        await executeElementEvents(element, "onSubmit");
      } catch (error) {
        console.error("Error submitting form", error);
      }
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
        await addDoc(collection(db, "site_users"), {
          ownerId: userId,
          email: formData.get("Email") as string,
          password: formData.get("Password") as string,
          role: "user",
          createdAt: serverTimestamp(),
        });
        setFormSuccess((prev) => ({ ...prev, [element.id]: true }));
        (e.target as HTMLFormElement).reset();
        await executeElementEvents(element, "onSubmit");
      } catch (e) {
        console.error(e);
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
        const q = query(
          collection(db, "site_users"),
          where("ownerId", "==", userId),
          where("email", "==", formData.get("Email")),
          where("password", "==", formData.get("Password")),
          limit(1),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFormSuccess((prev) => ({ ...prev, [element.id]: true }));
          await executeElementEvents(element, "onSubmit");
        } else {
          alert("Invalid credentials");
        }
      } catch (e) {
        console.error(e);
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
      case "text":
        return (
          <p id={element.customId} style={elStyle} className={customClass}>
            {replaceVariablesInText(element.content)}
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
      case "image":
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            id={element.customId}
            src={element.content}
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
      case "list":
        const listData =
          dataSources[element.id] && dataSources[element.id].length > 0
            ? dataSources[element.id].map((r) => Object.values(r).join(" - "))
            : element.content;
        return (
          <ul
            id={element.customId}
            style={{
              ...elStyle,
              listStyleType: "disc",
              paddingLeft: "20px",
              pointerEvents: isBuilderMode ? "none" : "auto",
            }}
            className={customClass}
          >
            {(Array.isArray(listData) ? listData : []).map(
              (item: any, i: number) => (
                <li key={i}>{replaceVariablesInText(String(item))}</li>
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
                // eslint-disable-next-line @next/next/no-img-element
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
            {element.type === "form" && (
              <>
                <input
                  type="text"
                  name="Name"
                  placeholder="Name"
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
                <input
                  type="email"
                  name="Email"
                  placeholder="Email"
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
              </>
            )}
            {element.type === "auth_form" && (
              <>
                <input
                  type="email"
                  name="Email"
                  placeholder="Email"
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
                <input
                  type="password"
                  name="Password"
                  placeholder="Password"
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
              </>
            )}
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
            {(element.content?.links || []).map((link: any, i: number) => (
              <button
                key={i}
                onClick={() => !isBuilderMode && window.open(link.url, "_self")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3b82f6",
                  cursor: isBuilderMode ? "default" : "pointer",
                  fontWeight: "medium",
                }}
              >
                {replaceVariablesInText(link.label)}
              </button>
            ))}
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
          <div id={element.customId} style={elStyle} className={customClass}>
            <input
              type="file"
              disabled={isBuilderMode}
              style={{ display: "none" }}
              id={`file-${element.id}`}
              onChange={() => executeElementEvents(element, "onClick")}
            />
            <label
              htmlFor={`file-${element.id}`}
              style={{
                cursor: isBuilderMode ? "default" : "pointer",
                color: "#6b7280",
                fontSize: "14px",
                display: "block",
              }}
            >
              {element.content?.buttonText || "Upload"}
            </label>
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

  return (
    <>
      {elements.map((el) => {
        const content = renderContent(el);
        if (isBuilderMode) {
          return <React.Fragment key={el.id}>{content}</React.Fragment>;
        }
        return (
          <div
            key={el.id}
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
      })}
    </>
  );
}
