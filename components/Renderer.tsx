/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from "react";
import { PageElement, AppVariable } from "@/lib/builder-store";
import { executeWorkflow } from "@/lib/workflow-engine";
import { supabase } from "@/lib/supabase";
import { Star, ChevronRight, TrendingUp, TrendingDown, Share2, Twitter, Facebook, Linkedin, Link2, Zap, Shield, Flame, Terminal } from "lucide-react";
import ExamResultLookup from "./templates/ExamResultLookup";
import DataSearch from "./templates/DataSearch";
import SupabaseUploadWidget from "./SupabaseUploadWidget";
import { 
  parseAndInjectDynamicValues, 
  evaluateValuePath, 
  evaluateCondition, 
  ParserContext 
} from "@/lib/data-parser";

interface AdvancedListRendererProps {
  element: PageElement;
  allElements?: PageElement[];
  elStyle: React.CSSProperties;
  customClass: string;
  dataSources: Record<string, any>;
  setDataSources?: any;
  variables: any[];
  setVariable?: (name: string, value: any) => void;
  isBuilderMode: boolean;
  userId?: string | null;
  slug?: string;
  username?: string;
  executeWorkflow: any;
  replaceVariablesInText: (text: string, item?: any) => string;
  handleListClick: (element: PageElement, item: any) => void;
  getItemImage: (item: any) => string | null;
  getItemTitle: (item: any) => string;
  getItemDescription: (item: any) => string;
}

export function AdvancedListRenderer({
  element,
  allElements = [],
  elStyle,
  customClass,
  dataSources,
  setDataSources,
  variables = [],
  setVariable,
  isBuilderMode,
  userId,
  slug,
  username,
  executeWorkflow,
  replaceVariablesInText,
  handleListClick,
  getItemImage,
  getItemTitle,
  getItemDescription
}: AdvancedListRendererProps) {
  // Core List variables
  const listType = element.type as string;
  const pageStateKey = `list_${element.id}_page`;
  const limitStateKey = `list_${element.id}_limit`;
  const listPage = (variables?.find(v => v.name === pageStateKey)?.defaultValue) ?? 1;
  const currentLimit = (variables?.find(v => v.name === limitStateKey)?.defaultValue) ?? ((element as any).pageSize ?? 10);

  // Fallback datasets for all 16 list types when table is unmapped or empty
  const defaultListsMockData: Record<string, any[]> = {
    simple_list: [
      { id: "s1", title: "العنصر الأول في القائمة", desc: "وصف توضيحي سريع وبسيط" },
      { id: "s2", title: "مستند لوحة البيانات", desc: "تم تحديث الملف منذ دقائق" },
      { id: "s3", title: "مراجعة الكود البرمجي", desc: "بانتظار موافقة مدير المشروع" }
    ],
    card_list: [
      { id: "c1", title: "اسم المنتج الأول", description: "هذا نص توضيحي يصف جودة ومميزات المنتج الفريد بالتفصيل الممل لجذب العملاء وزيادة المبيعات.", price: "$299", image: "https://picsum.photos/seed/p1/400/300" },
      { id: "c2", title: "اسم المنتج الثاني", description: "تفاصيل متكاملة عن المنتج ومقاساته المتنوعة مع الشحن السريع لباب المنزل مجاناً.", price: "$149", image: "https://picsum.photos/seed/p2/400/300" }
    ],
    image_list: [
      { id: "i1", title: "تصوير الطبيعة الخلابة", image: "https://picsum.photos/seed/n1/200/200" },
      { id: "i2", title: "رحلة جبلية استكشافية", image: "https://picsum.photos/seed/n2/200/200" },
      { id: "i3", title: "تصميم واجهة مستخدم حديثة", image: "https://picsum.photos/seed/n3/200/200" }
    ],
    avatar_list: [
      { id: "a1", name: "محمد الحربي", role: "رئيس مجلس الإدارة", bio: "شغوف ببناء منصات أدوات البرمجة بدون كود وتطوير أفكار الشباب.", image: "https://picsum.photos/seed/av1/100/100", status: "متصل" },
      { id: "a2", name: "سارة العتيبي", role: "مصمم واجهات أقدم", bio: "خبرة أكثر من ٥ سنوات في تنسيق هويات الشركات والواجهات التفاعلية.", image: "https://picsum.photos/seed/av2/100/100", status: "مشغول" }
    ],
    horizontal_card_list: [
      { id: "hc1", title: "دورة الـ No-Code المتقدمة", category: "برمجة وبناء", image: "https://picsum.photos/seed/c1/300/200", views: "١,٢ ألف مشاهدة" },
      { id: "hc2", title: "أساسيات التصميم التفاعلي", category: "تصميم هويات", image: "https://picsum.photos/seed/c2/300/200", views: "٨٤٠ مشاهدة" },
      { id: "hc3", title: "تكامل وبناء قواعد البيانات", category: "قواعد بيانات", image: "https://picsum.photos/seed/c3/300/200", views: "٢,١ ألف مشاهدة" }
    ],
    horizontal_chip_list: [
      { id: "ch1", title: "الكل" },
      { id: "ch2", title: "البرمجة بدون كود" },
      { id: "ch3", title: "تصميم الويب" },
      { id: "ch4", title: "الذكاء الاصطناعي" },
      { id: "ch5", title: "متاجر إلكترونية" }
    ],
    social_media_list: [
      { id: "sm1", author_name: "عمر الرويلي", avatar: "https://picsum.photos/seed/userOmar/100/100", time: "منذ ساعتين", body: "تحديث ضخم قادم غداً لمنصة الـ No-Code Builder! سنقوم بإطلاق نظام القوائم اللانهائي مع إمكانية تصميم كل كارت بحرية تامة كالرسم تماماً. متحمس جداً لمشاركتكم النتائج 🚀🤩", image: "https://picsum.photos/seed/smPost/800/400" },
      { id: "sm2", author_name: "هدى اليوسف", avatar: "https://picsum.photos/seed/userHuda/100/100", time: "منذ ٥ ساعات", body: "شرح مبسط لكيفية تنظيم السحب والإفلات وتخصيص الكروت لتوافق أحجام شاشات الجوال والتابلت باحترافية كاملة.", image: "" }
    ],
    custom_list: [
      { id: "cus1", title: "معلمة بطة فريدة", subtitle: "عنصر مخصص بالكامل" },
      { id: "cus2", title: "بطاقة الويب المتميزة", subtitle: "تنسيق متناسق وجذاب" }
    ],
    table: [
      { id: "t1", id_num: "١٠١", name: "عبدالله الشمري", role: "موظف تقني", status: "نشط", date: "٢٠٢٦-٠٥-١٢" },
      { id: "t2", id_num: "١٠٢", name: "دلال السديري", role: "مدير العلاقات", status: "موقوف", date: "٢٠٢٦-٠٤-٠١" },
      { id: "t3", id_num: "١٠٣", name: "رائد الرشيد", role: "مهندس برمجيات", status: "نشط", date: "٢٠٢٦-٠٥-٣٠" }
    ],
    masonry_list: [
      { id: "m1", title: "تصميم داخلي معاصر", image: "https://picsum.photos/seed/mas1/300/450" },
      { id: "m2", title: "واجهة إلكترونية", image: "https://picsum.photos/seed/mas2/300/300" },
      { id: "m3", title: "غلاف مجلة مذهل", image: "https://picsum.photos/seed/mas3/300/500" },
      { id: "m4", title: "ركن القهوة المودرن", image: "https://picsum.photos/seed/mas4/300/350" }
    ],
    kanban_board: [
      { id: "kb1", title: "أبحاث العملاء وهندسة المتطلبات", desc: "جمع الملاحظات وتأسيس مخططات تدفق البيانات لمصمم القوائم.", status: "To Do", badge: "مهم جداً", avatar: "https://picsum.photos/seed/kbA/100/100" },
      { id: "kb2", title: "برمجة محاكي السحب للهواتف", desc: "تطبيق التفاعل السلس على شاشات اللمس والتابلت الصغير.", status: "In Progress", badge: "جاري العمل", avatar: "https://picsum.photos/seed/kbB/100/100" },
      { id: "kb3", title: "رفع التحديثات على السيرفر", desc: "دفع الأكواد وفحص كفاءة وأداء السكرول والتحميل السريع.", status: "Done", badge: "مكتمل", avatar: "https://picsum.photos/seed/kbC/100/100" }
    ],
    calendar_list: [
      { id: "cal1", title: "إطلاق تجريبي للمصمم", date: "2026-06-05", time: "09:00 AM", type: "مهم" },
      { id: "cal2", title: "جلسة عصف ذهني للتنسيق", date: "2026-06-12", time: "11:30 AM", type: "عادي" },
      { id: "cal3", title: "اجتماع المستثمرين السنوي", date: "2026-06-25", time: "04:00 PM", type: "عاجل" }
    ],
    timeline_list: [
      { id: "tm1", title: "أول خطوة: التأسيس", desc: "إنشاء البنية التحتية وقائمة الكتل المخصصة للتحرير الفوري.", date: "يناير ٢٠٢٦" },
      { id: "tm2", title: "ثاني خطوة: التحديث", desc: "تطبيق مصمم هيكلية القائمة بملفات البيانات وتحريكها يدوياً.", date: "مارس ٢٠٢٦" },
      { id: "tm3", title: "ثاني خطوة: للتكامل", desc: "ربط القوالب بـ Appwrite ودمج ميزات تحديث البيانات اللحظي.", date: "يونيو ٢٠٢٦" }
    ],
    carousel_list: [
      { id: "car1", title: "طفرة الذكاء الاصطناعي وبناء المواقع", image: "https://picsum.photos/seed/caro1/800/400", desc: "كيف غيرت الأدوات الذكية أساليب البرمجة الحديثة تماماً." },
      { id: "car2", title: "مستقبل الـ No-Code وتكامل السحاب", image: "https://picsum.photos/seed/caro2/800/400", desc: "شروحات تقنية مبسطة للمطورين لتسريع دورة حياة بناء التطبيقات." }
    ],
    chat_list: [
      { id: "ch1", text: "أهلاً بك في الدعم الفني المطور! كيف نقدر نساعدك اليوم؟", sender: "support", time: "١٢:٠٠ م" },
      { id: "ch2", text: "أهلاً بك، أود تفعيل ميزة التحديثات اللحظية من سوبابيس للقوائم الخاصة بي.", sender: "me", time: "١٢:٠٣ م" },
      { id: "ch3", text: "بكل سرور! فقط فعل خيار «التكامل اللحظي» بجانب قائمة الفلاتر لتحديث الكروت أوتوماتيكياً.", sender: "support", time: "١٢:٠٤ م" }
    ],
    tree_list: [
      { id: "tr1", title: "المشروع التقني الموحد", isFolder: true, parentId: null },
      { id: "tr2", title: "واجهات التصميم", isFolder: true, parentId: "tr1" },
      { id: "tr3", title: "SidebarEditor.tsx", isFolder: false, parentId: "tr2" },
      { id: "tr4", title: "CustomListCanvas.tsx", isFolder: false, parentId: "tr2" },
      { id: "tr5", title: "ملفات الأصول والصور", isFolder: true, parentId: "tr1" },
      { id: "tr6", title: "avatar_placeholder.svg", isFolder: false, parentId: "tr5" }
    ]
  };

  // State hooks unconditional
  const [activeMonth, setActiveMonth] = useState(new Date());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Resolve data source safely
  const rawItemsSource =
    dataSources[element.id] && dataSources[element.id].length > 0
      ? dataSources[element.id]
      : (Array.isArray(element.content) && element.content.length > 0
          ? element.content
          : (defaultListsMockData[listType] || defaultListsMockData.simple_list));

  // Advanced Filtering
  const advancedFilters: any[] = (element as any).listFilters || [];
  const advancedSorts: any[] = (element as any).listSorts || [];

  let processedItems = [...rawItemsSource];

  if (advancedFilters.length > 0) {
    processedItems = processedItems.filter(item => {
      return advancedFilters.every((filter) => {
        const itemValue = item[filter.field];
        const compareValue = replaceVariablesInText(filter.value, item);
        const operand = filter.operator;

        if (itemValue === undefined || itemValue === null) {
          if (operand === "isEmpty") return true;
          if (operand === "isNotEmpty") return false;
          return false;
        }

        const sItemVal = String(itemValue).toLowerCase();
        const sCompVal = String(compareValue).toLowerCase();

        switch (operand) {
          case "eq": return sItemVal === sCompVal;
          case "neq": return sItemVal !== sCompVal;
          case "contains": return sItemVal.includes(sCompVal);
          case "startsWith": return sItemVal.startsWith(sCompVal);
          case "endsWith": return sItemVal.endsWith(sCompVal);
          case "gt": return Number(itemValue) > Number(compareValue);
          case "lt": return Number(itemValue) < Number(compareValue);
          case "isEmpty": return sItemVal.trim() === "";
          case "isNotEmpty": return sItemVal.trim() !== "";
          default: return true;
        }
      });
    });
  }

  // Multiple Sort levels
  if (advancedSorts.length > 0) {
    processedItems.sort((a, b) => {
      for (const sort of advancedSorts) {
        const valA = a[sort.field];
        const valB = b[sort.field];
        if (valA === valB) continue;
        const direct = sort.direction === "desc" ? -1 : 1;
        if (typeof valA === "number" && typeof valB === "number") {
          return (valA - valB) * direct;
        }
        return String(valA || "").localeCompare(String(valB || "")) * direct;
      }
      return 0;
    });
  }

  // Live real-time Supabase integration trigger
  useEffect(() => {
    if (isBuilderMode) return;
    if ((element as any).supabaseRealtimeEnabled && element.dataSource?.tableId) {
      const tableId = element.dataSource.tableId;
      const channel = supabase
        .channel(`list-realtime-${element.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: tableId === "site_users" ? "site_users" : "records" },
          () => {
            try {
              const customEvent = new CustomEvent("refetch-list-data", { detail: { tableId } });
              window.dispatchEvent(customEvent);
            } catch (e) {
              console.error("Realtime update trigger error", e);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [element, isBuilderMode]);

  // Virtual Scrolling & Infinite load-more controls
  const totalItems = processedItems.length;
  const totalPages = Math.ceil(totalItems / currentLimit);
  const paginatedItems = ((element as any).performanceMode === "pagination" || (element as any).performanceMode === "lazy_load")
    ? processedItems.slice((listPage - 1) * currentLimit, listPage * currentLimit)
    : processedItems;

  const triggerSubElementAction = async (sub: any, item: any) => {
    if (isBuilderMode) return;
    if (sub.actions && Array.isArray(sub.actions) && sub.actions.length > 0) {
      await executeWorkflow(sub.actions, {
        variables,
        setVariable,
        userId: userId || null,
        pageSlug: slug,
        username,
        currentListItem: item
      });
    } else {
      handleListClick(element, item);
    }
  };

  const renderSubLayoutElement = (sub: any, item: any): React.ReactNode => {
    if (sub.visible === false) return null;
    
    const s = sub.style || {};
    const subStyle: React.CSSProperties = {
      fontSize: s.fontSize,
      color: s.color,
      backgroundColor: s.backgroundColor,
      padding: s.padding,
      margin: s.margin,
      borderRadius: s.borderRadius ?? "8px",
      border: s.border,
      boxShadow: s.shadow,
      opacity: s.opacity !== undefined ? Number(s.opacity) / 100 : undefined,
      width: s.width ?? "auto",
      height: s.height ?? "auto",
      display: s.display ?? (sub.type === "container" ? "flex" : "block"),
      flexDirection: s.flexDirection ?? "column",
      gap: s.gap,
      alignItems: s.alignItems ?? "stretch",
      justifyContent: s.justifyContent ?? "start",
      flexWrap: s.flexWrap ?? "nowrap",
      textAlign: s.textAlign ?? "right",
      fontWeight: s.fontWeight,
      cursor: sub.actions?.length > 0 ? "pointer" : "default",
    };

    const textContent = replaceVariablesInText(sub.content || "", item);

    switch (sub.type) {
      case "heading":
        return (
          <h3 key={sub.id} style={subStyle} className="font-bold tracking-tight text-gray-900 leading-normal" onClick={() => triggerSubElementAction(sub, item)}>
            {textContent || "عنوان مخصص"}
          </h3>
        );
      case "rich_text":
      case "text":
        return (
          <div key={sub.id} style={subStyle} className="text-gray-700 text-xs leading-relaxed" onClick={() => triggerSubElementAction(sub, item)}>
            {textContent || "أدخل نص القائمة..."}
          </div>
        );
      case "image": {
        const url = replaceVariablesInText(sub.content || item.image || item.url, item) || "https://picsum.photos/seed/itempic/300/200";
        return (
          <img
            key={sub.id}
            src={url}
            alt={textContent || "صورة كارت"}
            style={{ ...subStyle, objectFit: "cover" }}
            className="transition-transform duration-200 hover:scale-[1.02]"
            referrerPolicy="no-referrer"
            onClick={() => triggerSubElementAction(sub, item)}
          />
        );
      }
      case "avatar": {
        const url = replaceVariablesInText(sub.content || item.avatar || item.image || item.url, item) || "https://picsum.photos/seed/avt/100/100";
        return (
          <div key={sub.id} style={subStyle} className="flex-shrink-0" onClick={() => triggerSubElementAction(sub, item)}>
            <img
              src={url}
              alt="صورة الرمز"
              className="w-10 h-10 rounded-full border border-gray-100 object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        );
      }
      case "badge":
        return (
          <span
            key={sub.id}
            style={{ ...subStyle, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold"
            onClick={() => triggerSubElementAction(sub, item)}
          >
            {textContent || "شارة"}
          </span>
        );
      case "button":
        return (
          <button
            key={sub.id}
            type="button"
            style={{ ...subStyle, pointerEvents: isBuilderMode ? "none" : "auto" }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer text-center"
            onClick={(e) => {
              e.stopPropagation();
              triggerSubElementAction(sub, item);
            }}
          >
            {textContent || "زر تفاعلي"}
          </button>
        );
      case "icon": {
        const IconComp = Star;
        return (
          <div key={sub.id} style={subStyle} onClick={() => triggerSubElementAction(sub, item)}>
            <IconComp className="w-5 h-5 text-indigo-500" />
          </div>
        );
      }
      case "video": {
        const videoUrl = replaceVariablesInText(sub.content || item.video || "https://www.youtube.com/embed/dQw4w9WgXcQ", item);
        return (
          <div key={sub.id} style={subStyle} className="aspect-video w-full rounded-lg overflow-hidden border">
            <iframe src={videoUrl} className="w-full h-full" frameBorder="0" allowFullScreen loading="lazy"></iframe>
          </div>
        );
      }
      case "rating": {
        const rateVal = Math.min(5, Math.max(0, parseInt(textContent) || item.rating || 5));
        return (
          <div key={sub.id} style={subStyle} className="flex gap-1" onClick={() => triggerSubElementAction(sub, item)}>
            {Array.from({ length: 5 }).map((_, rIdx) => (
              <Star key={rIdx} className={`w-4 h-4 ${rIdx < rateVal ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} />
            ))}
          </div>
        );
      }
      case "input":
        return (
          <input
            key={sub.id}
            type="text"
            placeholder={sub.content || "كتابة..."}
            style={subStyle}
            className="border px-3 py-1.5 rounded text-xs bg-white text-right w-full outline-hidden border-gray-200"
            onChange={(e) => {
              if (setVariable && sub.saveToVariable) {
                setVariable(sub.saveToVariable, e.target.value);
              }
            }}
          />
        );
      case "checkbox":
      case "switch": {
        const checkedVal = replaceVariablesInText(sub.content, item) === "true" || item.checked === true;
        return (
          <label key={sub.id} style={{ ...subStyle, display: "inline-flex" }} className="items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={checkedVal}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              onChange={(e) => {
                if (setVariable && sub.saveToVariable) {
                  setVariable(sub.saveToVariable, e.target.checked);
                }
              }}
            />
            <span className="text-gray-700 text-3xs">{textContent || "خيار"}</span>
          </label>
        );
      }
      case "divider":
        return <div key={sub.id} style={{ ...subStyle, height: "1px", backgroundColor: "#e5e7eb", width: "100%" }} />;
      case "html":
        return <div key={sub.id} style={subStyle} dangerouslySetInnerHTML={{ __html: textContent }} />;
      case "custom_component":
        return (
          <div key={sub.id} style={subStyle} className="p-3 bg-indigo-50 text-indigo-800 text-3xs rounded-lg border border-indigo-100 font-mono">
            [مكون خاص: {textContent || "Custom Template widget"}]
          </div>
        );
      case "container":
        return (
          <div key={sub.id} style={subStyle}>
            {(sub.children || []).map((child: any) => renderSubLayoutElement(child, item))}
          </div>
        );
      default:
        return <div key={sub.id} style={subStyle}>{textContent}</div>;
    }
  };
  
  const childrenElements = allElements.filter(e => e.parentId === element.id);
  const customLayoutItems = childrenElements.length > 0 ? childrenElements : (element.children && element.children.length > 0 ? element.children : ((element as any).listItemsLayout || []));
  const kanbanColumns = (element as any).kanbanColumns || ["To Do", "In Progress", "Done"];

  const daysInMonth = () => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const date = new Date(year, month, 1);
    const days: Date[] = [];
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const mobileCols = (element as any).mobileCols || 1;
  const tabletCols = (element as any).tabletCols || 2;
  const desktopCols = (element as any).desktopCols || 3;
  const responsiveGridClass = `grid grid-cols-${mobileCols} md:grid-cols-${tabletCols} lg:grid-cols-${desktopCols} gap-4 w-full`;

  const defaultTableHeaders = paginatedItems.length > 0 ? Object.keys(paginatedItems[0]).filter(k => k !== "id") : ["Name", "Role", "Status"];

  return (
    <div id={element.customId} style={elStyle} className={`${customClass} flex flex-col gap-4 text-right pr-px w-full`} dir="rtl">
      {listType === "calendar_list" && (
        <div className="flex justify-between items-center bg-gray-50 p-2 border rounded-xl" dir="rtl">
          <button
            type="button"
            onClick={() => setActiveMonth(new Date(activeMonth.setMonth(activeMonth.getMonth() - 1)))}
            className="p-1 px-3 bg-white border rounded text-xs hover:bg-gray-100 transition cursor-pointer"
          >
            السابق
          </button>
          <span className="font-bold text-xs text-gray-800">
            {activeMonth.toLocaleString("ar-EG", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => setActiveMonth(new Date(activeMonth.setMonth(activeMonth.getMonth() + 1)))}
            className="p-1 px-3 bg-white border rounded text-xs hover:bg-gray-100 transition cursor-pointer"
          >
            التالي
          </button>
        </div>
      )}

      {listType === "tree_list" ? (
        <div className="flex flex-col gap-1 w-full text-right p-1 bg-white border rounded-xl">
          {paginatedItems.filter(item => item.parentId === null).map((rootNode: any) => {
            const children = paginatedItems.filter(child => child.parentId === rootNode.id);
            const isNodeExpanded = !!expandedNodes[rootNode.id];
            const hasChildren = children.length > 0;
            return (
              <div key={rootNode.id} className="flex flex-col text-xs leading-normal">
                <div
                  onClick={() => toggleNode(rootNode.id)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition cursor-pointer"
                >
                  <span className="w-4 h-4 text-gray-400">
                    {hasChildren ? (isNodeExpanded ? "-" : "+") : "•"}
                  </span>
                  <span className="font-bold text-gray-800">{rootNode.title}</span>
                </div>
                {hasChildren && isNodeExpanded && (
                  <div className="pr-6 flex flex-col border-r border-dashed border-gray-200">
                    {children.map((sub: any) => (
                      <div
                        key={sub.id}
                        onClick={() => triggerSubElementAction(sub, sub)}
                        className="p-2 hover:bg-gray-50 text-gray-600 transition cursor-pointer rounded-lg text-[11px]"
                      >
                        - {sub.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : listType === "kanban_board" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {kanbanColumns.map((colName: string) => {
            const colItems = paginatedItems.filter((item) => (item.status === colName || item.stage === colName));
            return (
              <div key={colName} className="flex flex-col bg-gray-50/70 border border-gray-100 rounded-2xl p-4 min-h-[300px]">
                <div className="flex justify-between items-center border-b pb-2 mb-3">
                  <span className="font-bold text-xs text-gray-800">{colName}</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-[10px] font-extrabold rounded-full">
                    {colItems.length}
                  </span>
                </div>
                <div className="flex flex-col gap-2.5">
                  {colItems.map((item: any, i: number) => (
                    <div
                      key={item.id || i}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", item.id);
                      }}
                      className="bg-white border hover:border-indigo-300 p-3.5 rounded-xl shadow-3xs cursor-grab active:cursor-grabbing hover:shadow-xs transition"
                      onClick={() => triggerSubElementAction(element, item)}
                    >
                      {customLayoutItems.length > 0 ? (
                        customLayoutItems.map((sub: any) => renderSubLayoutElement(sub, item))
                      ) : (
                        <div>
                          <h4 className="font-bold text-xs text-gray-900 mb-1">{item.title}</h4>
                          <p className="text-[11px] text-gray-500 leading-normal mb-2">{item.desc}</p>
                          <div className="flex justify-between items-center">
                            {item.avatar && (
                              <img src={item.avatar} alt="كارت" className="w-5 h-5 rounded-full object-cover" referrerPolicy="no-referrer" />
                            )}
                            {item.badge && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[9px] rounded-full font-bold">{item.badge}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : listType === "calendar_list" ? (
        <div className="grid grid-cols-7 gap-1 border-t border-r w-full bg-white rounded-xl overflow-hidden shadow-xs">
          {["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"].map((dayName) => (
            <div key={dayName} className="bg-gray-50/80 text-center py-2 text-3xs font-extrabold text-gray-500 border-b border-l">
              {dayName}
            </div>
          ))}
          {daysInMonth().map((dayDate, dIdx) => {
            const dayStr = dayDate.toISOString().split("T")[0];
            const events = paginatedItems.filter(item => item.date === dayStr);
            return (
              <div key={dIdx} className="bg-white hover:bg-gray-50/50 transition border-l border-b min-h-[90px] p-1 flex flex-col justify-between text-right">
                <span className="text-[10px] font-bold text-gray-400">{dayDate.getDate()}</span>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-[60px] pb-1">
                  {events.map((ev: any, evIdx) => (
                    <div
                      key={ev.id || evIdx}
                      onClick={() => triggerSubElementAction(element, ev)}
                      className="bg-indigo-50 hover:bg-indigo-100/80 transition text-indigo-700 text-[9px] p-1 rounded-sm leading-tight truncate cursor-pointer font-bold"
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : listType === "timeline_list" ? (
        <div className="flex flex-col relative pr-4" dir="rtl">
          <div className="absolute right-1 px-px h-full border-r border-indigo-200 mt-2"></div>
          
          <div className="flex flex-col gap-6">
            {paginatedItems.map((item: any, i: number) => (
              <div key={item.id || i} className="flex relative items-start gap-4" onClick={() => triggerSubElementAction(element, item)}>
                <div className="absolute -right-[19px] z-10 w-3 h-3 bg-indigo-600 rounded-full ring-4 ring-indigo-50 border border-white"></div>
                
                <div className="flex-1 bg-white border hover:border-indigo-200 p-4 rounded-xl shadow-3xs hover:shadow-xs transition">
                  {customLayoutItems.length > 0 ? (
                    customLayoutItems.map((sub: any) => renderSubLayoutElement(sub, item))
                  ) : (
                    <div>
                      <div className="text-[10px] font-bold text-indigo-600 mb-0.5">{item.date}</div>
                      <h4 className="font-bold text-xs text-gray-900 mb-1">{item.title}</h4>
                      <p className="text-[11px] text-gray-500 leading-normal">{item.desc}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : listType === "carousel_list" ? (
        <div className="relative w-full rounded-2xl overflow-hidden border bg-white" dir="rtl">
          {paginatedItems.length > 0 && (
            <div className="relative aspect-video w-full flex flex-col justify-end bg-black">
              <img
                src={paginatedItems[carouselIndex]?.image || "https://picsum.photos/seed/slide/800/400"}
                alt="سلايدر"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent"></div>
              <div className="relative p-6 text-white text-right z-10">
                <h3 className="font-extrabold text-sm md:text-base mb-1">{paginatedItems[carouselIndex]?.title}</h3>
                <p className="text-[11px] md:text-xs text-gray-250 leading-relaxed max-w-xl">{paginatedItems[carouselIndex]?.desc}</p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex(prev => (prev - 1 + paginatedItems.length) % paginatedItems.length);
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer z-25"
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCarouselIndex(prev => (prev + 1) % paginatedItems.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition cursor-pointer z-25"
              >
                {">"}
              </button>
            </div>
          )}
        </div>
      ) : listType === "chat_list" ? (
        <div className="flex flex-col gap-3 w-full max-h-[400px] overflow-y-auto p-2 bg-gray-50/50 rounded-2xl border" dir="rtl">
          {paginatedItems.map((item: any, i: number) => {
            const isMe = item.sender === "me" || item.isMe === true;
            return (
              <div
                key={item.id || i}
                onClick={() => triggerSubElementAction(element, item)}
                className={`flex flex-col max-w-[80%] ${isMe ? "self-end ml-1 items-end" : "self-start mr-1 items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl text-xs leading-normal shadow-3xs ${
                    isMe
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border rounded-bl-none"
                  }`}
                >
                  {item.text}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1 font-mono">{item.time}</span>
              </div>
            );
          })}
        </div>
      ) : listType === "table" ? (
        <div className="w-full overflow-x-auto rounded-xl border border-gray-100 shadow-xs">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-gray-50/80 text-gray-500 font-extrabold border-b">
              <tr>
                {defaultTableHeaders.map((header) => (
                  <th key={header} className="p-3 uppercase tracking-wider">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {paginatedItems.map((item: any, rowIdx) => (
                <tr
                  key={item.id || rowIdx}
                  onClick={() => triggerSubElementAction(element, item)}
                  className="hover:bg-gray-50/60 transition cursor-pointer"
                >
                  {defaultTableHeaders.map((header) => (
                    <td key={header} className="p-3 font-semibold text-gray-800">
                      {replaceVariablesInText(String(item[header] !== undefined ? item[header] : ""), item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : listType === "horizontal_list" || listType === "horizontal_chip_list" ? (
        <div className="flex flex-row overflow-x-auto gap-3 pb-2 pt-1 snap-x scrollbar-none" dir="rtl">
          {paginatedItems.map((item: any, i: number) => {
            const title = getItemTitle(item);
            return (
              <div
                key={item.id || i}
                onClick={() => triggerSubElementAction(element, item)}
                className="flex-none bg-gray-100 hover:bg-gray-200/85 hover:border-indigo-200 border border-transparent px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer"
              >
                {replaceVariablesInText(title)}
              </div>
            );
          })}
        </div>
      ) : listType === "horizontal_card_list" ? (
        <div className="flex flex-row overflow-x-auto gap-4 pb-3 pt-1 snap-x scrollbar-none" dir="rtl">
          {paginatedItems.map((item: any, i: number) => (
            <div
              key={item.id || i}
              onClick={() => triggerSubElementAction(element, item)}
              className="flex-none w-56 aspect-[4/5] bg-white border border-gray-100 hover:border-indigo-100 shadow-3xs hover:shadow-xs transition rounded-2xl overflow-hidden flex flex-col"
            >
              <img src={item.image || "https://picsum.photos/seed/h1/300/200"} alt="كارت" className="w-full h-32 object-cover border-b" referrerPolicy="no-referrer" />
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-indigo-600 font-extrabold mb-0.5 block">{item.category}</span>
                  <h4 className="font-bold text-xs text-gray-900 leading-normal line-clamp-2">{item.title}</h4>
                </div>
                <span className="text-[10px] text-gray-400 block mt-1">{item.views}</span>
              </div>
            </div>
          ))}
        </div>
      ) : listType === "masonry_list" ? (
        <div className="columns-2 md:columns-3 gap-4 space-y-4 w-full">
          {paginatedItems.map((item: any, i: number) => (
            <div
              key={item.id || i}
              onClick={() => triggerSubElementAction(element, item)}
              className="break-inside-avoid shadow-3xs rounded-2xl overflow-hidden bg-white border hover:shadow-xs transition cursor-pointer"
            >
              <img src={item.image || "https://picsum.photos/seed/mason/400/300"} alt={item.title} className="w-full h-auto object-cover max-h-72" referrerPolicy="no-referrer" />
              <div className="p-3 text-xs font-bold text-gray-800 border-t bg-gray-50/40">
                {replaceVariablesInText(item.title)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={responsiveGridClass}>
          {paginatedItems.map((item: any, i: number) => {
            const imgUrl = getItemImage(item);
            const title = getItemTitle(item);
            const desc = getItemDescription(item);

            return (
              <div
                key={item.id || i}
                onClick={() => triggerSubElementAction(element, item)}
                className="bg-white border hover:border-indigo-100/80 rounded-2xl overflow-hidden shadow-3xs hover:shadow-xs transition"
              >
                {customLayoutItems.length > 0 ? (
                  <div className="p-4 flex flex-col gap-2 w-full">
                    {customLayoutItems.map((sub: any) => renderSubLayoutElement(sub, item))}
                  </div>
                ) : listType === "social_media_list" ? (
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-2.5 items-center">
                      <img src={item.avatar || "https://picsum.photos/seed/smAv/100/100"} alt="أفاتار" className="w-8 h-8 rounded-full border border-gray-100 object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-xs truncate leading-tight">{item.author_name}</h4>
                        <span className="text-[10px] text-gray-400 block mt-0.5">{item.time}</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-xs leading-relaxed">{item.body}</p>
                    {item.image && (
                      <img src={item.image} alt="صورة البوست" className="w-full h-44 object-cover rounded-xl" referrerPolicy="no-referrer" />
                    )}
                    <div className="flex justify-between items-center border-t pt-2.5 text-gray-500 text-3xs font-bold px-1 mt-1">
                      <button type="button" className="flex items-center gap-1.5 hover:text-red-500 transition cursor-pointer"><span>❤️</span> إعجاب</button>
                      <button type="button" className="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer"><span>💬</span> تعليق</button>
                      <button type="button" className="flex items-center gap-1.5 hover:text-indigo-600 transition cursor-pointer"><span>↕️</span> مشاركة</button>
                    </div>
                  </div>
                ) : listType === "avatar_list" ? (
                  <div className="p-4 flex items-center gap-3">
                    <img src={item.image || "https://picsum.photos/seed/aAv/200/200"} alt="أفاتار" className="w-11 h-11 rounded-full object-cover border" referrerPolicy="no-referrer" />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-bold text-gray-950 text-xs truncate">{item.name}</h4>
                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">{item.status}</span>
                      </div>
                      <span className="text-[10px] text-indigo-600 font-extrabold block mb-0.5">{item.role}</span>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">{item.bio}</p>
                    </div>
                  </div>
                ) : listType === "image_list" ? (
                  <div className="p-3.5 flex items-center gap-3">
                    <img src={imgUrl || "https://picsum.photos/seed/imgList/200/200"} alt={title} className="w-12 h-12 rounded-lg object-cover border" referrerPolicy="no-referrer" />
                    <h4 className="font-bold text-gray-900 text-xs leading-snug">{replaceVariablesInText(title)}</h4>
                  </div>
                ) : listType === "card_list" ? (
                  <div className="flex flex-col">
                    {imgUrl && (
                      <img src={imgUrl} alt={title} className="w-full h-40 object-cover border-b" referrerPolicy="no-referrer" />
                    )}
                    <div className="p-4">
                      <h4 className="font-bold text-gray-900 text-xs mb-1 truncate">{replaceVariablesInText(title)}</h4>
                      <p className="text-[11px] text-gray-500 leading-normal line-clamp-2">{replaceVariablesInText(desc)}</p>
                      {item.price && (
                        <div className="flex justify-between items-center mt-3 border-t pt-2.5">
                          <span className="font-extrabold text-sm text-indigo-600">{item.price}</span>
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-bold">عرض التفاصيل</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      <h4 className="font-bold text-gray-900 text-xs truncate">{replaceVariablesInText(title)}</h4>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 transform rotate-180" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {((element as any).performanceMode === "pagination") && totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-4 bg-gray-50/50 p-2 border rounded-xl w-fit mx-auto" dir="rtl">
          <button
            type="button"
            disabled={listPage <= 1}
            onClick={() => setVariable?.(pageStateKey, listPage - 1)}
            className="px-3 py-1.5 bg-white border border-gray-100 disabled:opacity-50 text-3xs font-extrabold rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            السابق
          </button>
          <span className="text-[10px] text-gray-500 font-bold">
            صفحة {listPage} من {totalPages}
          </span>
          <button
            type="button"
            disabled={listPage >= totalPages}
            onClick={() => setVariable?.(pageStateKey, listPage + 1)}
            className="px-3 py-1.5 bg-white border border-gray-100 disabled:opacity-50 text-3xs font-extrabold rounded-lg hover:bg-gray-100 transition cursor-pointer"
          >
            التالي
          </button>
        </div>
      )}

      {((element as any).performanceMode === "infinite_scroll") && totalItems > currentLimit && (
        <button
          type="button"
          onClick={() => {
            if (setVariable) {
              setVariable(limitStateKey, currentLimit + 10);
            }
          }}
          className="w-full text-center py-2 bg-indigo-50 hover:bg-indigo-100/90 text-indigo-700 text-xs font-bold rounded-2xl border border-indigo-100/50 transition cursor-pointer"
        >
          تحميل المزيد من النتائج ⚡
        </button>
      )}
    </div>
  );
}

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
  const [userTables, setUserTables] = useState<any[]>([]);
  const [tableRecords, setTableRecords] = useState<Record<string, any[]>>({});
  
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<{ [key: string]: boolean }>({});
  const [formElementsValues, setFormElementsValues] = useState<Record<string, any>>({});

  useEffect(() => {
    // Fetch profile and tables
    const fetchProfileAndTables = async () => {
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

      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .eq('user_id', userId);

      if (!profileError && profileData) {
        setCurrentUserProfile(profileData);
      }
      if (!settingsError && settingsData) {
        setUserSettings(settingsData);
      }
      if (tablesData) {
        const parsedTables = tablesData.map((t: any) => ({
          ...t,
          fields: typeof t.fields === 'string' ? JSON.parse(t.fields) : t.fields
        }));
        setUserTables(parsedTables);
      }
    };
    fetchProfileAndTables();

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
            .select('*')
            .eq('table_id', tableId);
            
          if (error) throw error;
          if (data) {
            const records = data.map((d: any) => {
              const parsed = typeof d.data === 'string' ? JSON.parse(d.data) : d.data;
              return {
                id: d.id,
                created_at: d.created_at,
                ...(parsed || {})
              };
            });
            
            // Sync to table records map for relational lookup
            setTableRecords(prev => ({
              ...prev,
              [tableId]: records
            }));

            return records;
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
          "avatar_list", "horizontal_card_list", "horizontal_chip_list", "social_media_list",
          "kanban_board", "calendar_list", "timeline_list", "carousel_list",
          "chat_list", "tree_list",
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
    
    const parserContext: ParserContext = {
      user: currentUserProfile || variables.find(v => v.name === 'currentUser')?.defaultValue,
      currentRecord: null,
      currentListItem: localContext,
      parentRecord: null,
      urlParams: { slug: slug || "", username: username || "" },
      variables: variables,
      userTables: userTables,
      allRecords: tableRecords
    };

    return parseAndInjectDynamicValues(text, parserContext);
  };

  const isElementVisible = (element: PageElement, localContext: any = null): boolean => {
    if (isBuilderMode) return true;
    // Check if element visibility configuration is set and conditional
    const visConfig = (element as any).visibilityConfig;
    if (!visConfig) {
      return true;
    }

    const parserContext: ParserContext = {
      user: currentUserProfile || variables.find(v => v.name === 'currentUser')?.defaultValue,
      currentRecord: null,
      currentListItem: localContext,
      parentRecord: null,
      urlParams: { slug: slug || "", username: username || "" },
      variables: variables,
      userTables: userTables,
      allRecords: tableRecords
    };

    // Support simpler direct visibility config model
    if (visConfig.field !== undefined && visConfig.operator !== undefined) {
      const leftRaw = replaceVariablesInText(visConfig.field, localContext);
      const rightRaw = replaceVariablesInText(visConfig.value, localContext);
      return evaluateCondition(leftRaw, visConfig.operator, rightRaw);
    }

    if (visConfig.mode !== "conditional") {
      return true;
    }
    const conditions = visConfig.conditions || [];
    if (conditions.length === 0) return true;

    return conditions.every((cond: any) => {
      const leftVal = evaluateValuePath(cond.leftPath, parserContext);
      return evaluateCondition(leftVal, cond.operator, cond.rightValue);
    });
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

    switch (element.type as any) {
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
      case "simple_list":
      case "card_list":
      case "image_list":
      case "avatar_list":
      case "horizontal_list":
      case "horizontal_card_list":
      case "horizontal_chip_list":
      case "custom_list":
      case "table_list":
      case "table":
      case "social_media_list":
      case "masonry_list":
      case "kanban_board":
      case "calendar_list":
      case "timeline_list":
      case "carousel_list":
      case "chat_list":
      case "tree_list": {
        return (
          <AdvancedListRenderer
            element={element}
            allElements={elements}
            elStyle={elStyle}
            customClass={customClass}
            dataSources={dataSources}
            setDataSources={setDataSources}
            variables={variables}
            setVariable={setVariable}
            isBuilderMode={!!isBuilderMode}
            userId={userId}
            slug={slug}
            username={username}
            executeWorkflow={executeWorkflow}
            replaceVariablesInText={replaceVariablesInText}
            handleListClick={handleListClick}
            getItemImage={getItemImage}
            getItemTitle={getItemTitle}
            getItemDescription={getItemDescription}
          />
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
      case "html":
        return (
          <div
            id={element.customId}
            style={elStyle}
            className={customClass}
            dangerouslySetInnerHTML={{ __html: replaceVariablesInText(element.content) }}
          />
        );
      case "rich_text":
        return (
          <div
            id={element.customId}
            style={elStyle}
            className={customClass}
            dangerouslySetInnerHTML={{ __html: replaceVariablesInText(element.content) }}
          />
        );
      case "switch":
      case "checkbox":
        return (
          <label id={element.customId} style={elStyle} className={`${customClass} cursor-pointer`}>
            <input
              type="checkbox"
              className={element.type === "switch" ? "w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 appearance-none transition-colors" : ""}
              style={element.type !== "switch" ? undefined : { pointerEvents: isBuilderMode ? "none" : "auto", display: 'none' }}
              checked={formElementsValues[element.id] ?? element.content?.checked}
              onChange={(e) => {
                if (!isBuilderMode) {
                  setFormElementsValues(prev => ({ ...prev, [element.id]: e.target.checked }));
                  executeElementEvents(element, "onChange");
                }
              }}
              disabled={isBuilderMode}
            />
            {element.type === "switch" && (
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            )}
            <span>{replaceVariablesInText(element.content?.label)}</span>
          </label>
        );
      case "container":
      case "column":
      case "row":
        const children = elements.filter((child) => child.parentId === element.id);
        const childrenNodes = children.length > 0 ? (
          children.sort((a,b) => (a.position?.y || 0) - (b.position?.y || 0)).map((child) => (
             <MemoizedElement
                 key={child.id}
                 el={child}
                 isBuilderMode={isBuilderMode}
                 dataSourceStr={JSON.stringify(dataSources[child.id] || null)}
                 isSubmittingStr={String(isSubmitting)}
                 formSuccessStr={String(formSuccess)}
                 variableStr={JSON.stringify(variables)}
                 renderContent={renderContent}
             />
          ))
        ) : (
          isBuilderMode ? <div className="p-4 border-2 border-dashed border-gray-300 rounded text-center text-gray-400 text-sm">Empty Container</div> : null
        );
        return (
          <div id={element.customId} style={elStyle} className={`${customClass} relative`}>
            {childrenNodes}
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
  const rootElements = elements.filter(e => !e.parentId);
  const sortedElements = isBuilderMode 
    ? rootElements 
    : [...rootElements].sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));

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
        if (!isElementVisible(el)) return null;
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
