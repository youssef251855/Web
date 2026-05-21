// Builder Page
"use client";

import { useEffect, useState, useRef, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useBuilderStore, ElementType, PageElement } from "@/lib/builder-store";
import { useShallow } from 'zustand/react/shallow';
import { motion } from "motion/react";
import {
  ArrowLeft,
  Smartphone,
  Save,
  Type,
  Heading,
  Image as ImageIcon,
  Video,
  Square,
  Minus,
  CreditCard,
  Star,
  AlignJustify,
  List,
  Plus,
  Layout,
  Settings,
  Quote,
  Map,
  Music,
  AlertCircle,
  Tag,
  Send,
  Copy,
  Check,
  ChevronDown,
  DollarSign,
  MessageSquare,
  Clock,
  BatteryMedium,
  Share2,
  FormInput,
  Table as TableIcon,
  Code,
  User,
  LayoutTemplate,
  BarChart,
  ListOrdered,
  StarHalf,
  Mail,
  UserSquare,
  AppWindow,
  ChevronRight,
  Tags,
  Search,
  Flag,
  PanelBottom,
  Lightbulb,
  CheckSquare,
  Loader,
  ToggleRight,
  PenTool,
  UserPlus,
   Download,
  LayoutGrid,
  ArrowRight,
  TrendingUp,
  Percent,
  Layers,
} from "lucide-react";
import SupabaseUploadWidget from "@/components/SupabaseUploadWidget";
import ActionEditor from "@/components/ActionEditor";
import Renderer from "@/components/Renderer";
import ExportCodeModal from "@/components/ExportCodeModal";

const SIDEBAR_CATEGORIES = [
  {
    name: "Layout & Basic",
    items: [
      { type: "section_block", icon: AlignJustify, label: "Section" },
      { type: "text", icon: Type, label: "Text" },
      { type: "heading", icon: Heading, label: "Heading" },
      { type: "spacer", icon: AlignJustify, label: "Spacer" },
      { type: "divider", icon: Minus, label: "Divider" },
      { type: "image", icon: ImageIcon, label: "Image" },
      { type: "video", icon: Video, label: "Video" },
      { type: "button", icon: Square, label: "Button" },
      { type: "card", icon: CreditCard, label: "Card" },
      { type: "icon", icon: Star, label: "Icon" },
      { type: "logo", icon: ImageIcon, label: "Logo" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Lists & Data",
    items: [
      { type: "list", icon: List, label: "List" },
      { type: "simple_list", icon: List, label: "Simple List" },
      { type: "card_list", icon: LayoutGrid, label: "Card List" },
      { type: "image_list", icon: ImageIcon, label: "Image List" },
      { type: "masonry_list", icon: LayoutGrid, label: "Masonry List" },
      { type: "horizontal_list", icon: ArrowRight, label: "Horizontal List" },
      { type: "custom_list", icon: List, label: "Custom List" },
      { type: "table", icon: TableIcon, label: "Table" },
      { type: "badge", icon: Tag, label: "Badge" },
      { type: "accordion", icon: ChevronDown, label: "Accordion" },
      { type: "progress", icon: BatteryMedium, label: "Progress" },
      { type: "stat", icon: BarChart, label: "Stat" },
      { type: "checklist", icon: CheckSquare, label: "Checklist" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Marketing",
    items: [
      { type: "hero", icon: LayoutTemplate, label: "Hero" },
      { type: "pricing", icon: DollarSign, label: "Pricing" },
      { type: "testimonial", icon: MessageSquare, label: "Testimonial" },
      { type: "newsletter", icon: Mail, label: "Newsletter" },
      { type: "banner", icon: Flag, label: "Banner" },
      { type: "callout", icon: Lightbulb, label: "Callout" },
      { type: "marquee", icon: Type, label: "Marquee" },
      { type: "quote", icon: Quote, label: "Quote" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Components",
    items: [
      { type: "gallery", icon: ImageIcon, label: "Gallery" },
      { type: "countdown", icon: Clock, label: "Countdown" },
      { type: "map", icon: Map, label: "Map" },
      { type: "audio", icon: Music, label: "Audio" },
      { type: "avatar", icon: User, label: "Avatar" },
      { type: "steps", icon: ListOrdered, label: "Steps" },
      { type: "rating", icon: StarHalf, label: "Rating" },
      { type: "profile", icon: UserSquare, label: "Profile" },
      { type: "search", icon: Search, label: "Search" },
      { type: "social", icon: Share2, label: "Social" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Forms & Auth",
    items: [
      { type: "form", icon: FormInput, label: "Form" },
      { type: "blank_form", icon: FormInput, label: "Blank Form" },
      { type: "input", icon: Type, label: "Input" },
      { type: "label", icon: Type, label: "Label" },
      { type: "auth_form", icon: UserPlus, label: "Sign Up / Login" },
      { type: "toggle", icon: ToggleRight, label: "Toggle" },
      { type: "signature", icon: PenTool, label: "Signature" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Structure & Misc",
    items: [
      { type: "footer", icon: PanelBottom, label: "Footer" },
      { type: "breadcrumbs", icon: ChevronRight, label: "Breadcrumbs" },
      { type: "iframe", icon: AppWindow, label: "Iframe" },
      { type: "code", icon: Code, label: "Code" },
      { type: "spinner", icon: Loader, label: "Spinner" },
      { type: "tags", icon: Tags, label: "Tags" },
      { type: "loading_screen", icon: Loader, label: "Loading Screen" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Files",
    items: [
      { type: "file_upload", icon: ImageIcon, label: "File Upload" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Advanced & Custom",
    items: [
      { type: "nav_bar", icon: PanelBottom, label: "Nav Bar" },
      { type: "product_card", icon: Tag, label: "Product Card" },
      { type: "blog_card", icon: Code, label: "Blog Card" },
      { type: "stats_grid", icon: BarChart, label: "Stats Grid" },
      { type: "timeline", icon: ListOrdered, label: "Timeline" },
      { type: "carousel", icon: ImageIcon, label: "Carousel" },
      { type: "date_picker", icon: Clock, label: "Date Picker" },
      { type: "color_picker", icon: AppWindow, label: "Color Picker" },
      { type: "qr_code", icon: Search, label: "QR Code" },
      { type: "chat_bubble", icon: MessageSquare, label: "Chat Bubble" },
      { type: "comment_box", icon: MessageSquare, label: "Comment Box" },
      { type: "weather", icon: Clock, label: "Weather Widget" },
      { type: "stock_ticker", icon: DollarSign, label: "Stock Ticker" },
      { type: "price_card", icon: DollarSign, label: "Price Card" },
      { type: "map_pin", icon: Map, label: "Map Pin" },
      { type: "animated_counter", icon: Clock, label: "Counter" },
      { type: "tooltip_text", icon: Type, label: "Tooltip" },
      { type: "dropdown_menu", icon: ChevronDown, label: "Dropdown" },
      { type: "range_slider", icon: Minus, label: "Slider" },
      { type: "bento_grid", icon: LayoutGrid, label: "Bento Grid" },
      { type: "trend_stat", icon: TrendingUp, label: "Trend Stat" },
      { type: "social_share", icon: Share2, label: "Social Share" },
      { type: "circular_progress", icon: Percent, label: "Circular Progress" },
      { type: "dynamic_tabs", icon: Layers, label: "Dynamic Tabs" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
];

const BuilderElementContainer = memo(function BuilderElementContainer({
  id,
  canvasRef,
  setMobileView,
}: {
  id: string;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setMobileView: (view: "elements" | "canvas" | "properties") => void;
}) {
  const element = useBuilderStore((state) => state.elements.find((e) => e.id === id));
  if (!element) return null;
  return <BuilderElement element={element} canvasRef={canvasRef} setMobileView={setMobileView} />;
});

const BuilderCanvasMap = memo(function BuilderCanvasMap({
  canvasRef,
  setMobileView,
}: {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setMobileView: (view: "elements" | "canvas" | "properties") => void;
}) {
  const elementIds = useBuilderStore(useShallow((s) => s.elements.map(e => e.id)));
  return (
    <>
      {elementIds.map((id) => (
        <BuilderElementContainer
          key={id}
          id={id}
          canvasRef={canvasRef}
          setMobileView={setMobileView}
        />
      ))}
    </>
  );
});

export default function BuilderPage() {
  const { id } = useParams();
  const { user, username, loading } = useAuth();
  const router = useRouter();
  
  const setElements = useBuilderStore((s) => s.setElements);
  const sitePages = useBuilderStore((s) => s.sitePages);
  const setSitePages = useBuilderStore((s) => s.setSitePages);
  const currentPageId = useBuilderStore((s) => s.currentPageId);
  const setCurrentPageId = useBuilderStore((s) => s.setCurrentPageId);
  const addSitePage = useBuilderStore((s) => s.addSitePage);
  const updateSitePage = useBuilderStore((s) => s.updateSitePage);
  const removeSitePage = useBuilderStore((s) => s.removeSitePage);
  const variables = useBuilderStore((s) => s.variables);
  const setVariables = useBuilderStore((s) => s.setVariables);
  const addElement = useBuilderStore((s) => s.addElement);
  const updateElement = useBuilderStore((s) => s.updateElement);
  const removeElement = useBuilderStore((s) => s.removeElement);
  const selectedElementId = useBuilderStore((s) => s.selectedElementId);
  const selectElement = useBuilderStore((s) => s.selectElement);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [topTab, setTopTab] = useState<
    "editor" | "database" | "users" | "settings"
  >("editor");
  const [mobileView, setMobileView] = useState<
    "elements" | "canvas" | "properties"
  >("canvas");
  const [leftTab, setLeftTab] = useState<"pages" | "elements" | "variables">("pages");
  const [userPages, setUserPages] = useState<
    { id: string; title: string; slug: string }[]
  >([]);
  const [userTables, setUserTables] = useState<
    { id: string; name: string; fields: any[] }[]
  >([]);
  const [userSettings, setUserSettings] = useState<{
    settings: {
      cloudinaryCloudName?: string;
      cloudinaryUploadPreset?: string;
    };
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const applyWhatsAppTemplate = async () => {
    if (!user) {
      alert("يرجى تسجيل الدخول أولاً لتطبيق القالب.");
      return;
    }
    const confirmApply = confirm("هل أنت متأكد من رغبتك في تطبيق قالب واتساب المتكامل؟ سيؤدي ذلك إلى إنشاء جداول بيانات جهات الاتصال والرسائل تلقائياً وإنشاء 3 صفحات متصلة بالكامل.");
    if (!confirmApply) return;

    try {
      // 1. Fetch user's tables
      const { data: userTables, error: tablesError } = await supabase
        .from("tables")
        .select("*")
        .eq("user_id", user.id);

      if (tablesError) throw tablesError;

      let contactTable = userTables?.find(t => t.name === "جهات اتصال واتساب");
      let messageTable = userTables?.find(t => t.name === "رسائل واتساب Web");

      // 2. Create WhatsApp Contacts Table if it doesn't exist
      if (!contactTable) {
        const { data: newT, error: errT } = await supabase
          .from("tables")
          .insert({
            user_id: user.id,
            name: "جهات اتصال واتساب",
            fields: JSON.stringify([
              { name: "Name", type: "text" },
              { name: "Status", type: "text" },
              { name: "Image", type: "text" }
            ])
          })
          .select()
          .single();

        if (errT) throw errT;
        contactTable = newT;

        // Insert initial contact records
        await supabase.from("records").insert([
          {
            table_id: contactTable.id,
            user_id: user.id,
            data: JSON.stringify({ Name: "أحمد (مصر)", Status: "متاح للكلام ومتحمس جداً!", Image: "https://picsum.photos/seed/ahmad/80/80" })
          },
          {
            table_id: contactTable.id,
            user_id: user.id,
            data: JSON.stringify({ Name: "سارة (السعودية)", Status: "في العمل 💼 | الرجاء كتابة رسالة", Image: "https://picsum.photos/seed/sara/80/80" })
          },
          {
            table_id: contactTable.id,
            user_id: user.id,
            data: JSON.stringify({ Name: "خالد (الكويت)", Status: "مشغول حالياً 🚫 سأتحدث لاحقاً", Image: "https://picsum.photos/seed/khaled/80/80" })
          },
          {
            table_id: contactTable.id,
            user_id: user.id,
            data: JSON.stringify({ Name: "فريق الدعم الفني", Status: "كيف يمكنني مساعدتك اليوم؟ 🟢", Image: "https://picsum.photos/seed/support/80/80" })
          }
        ]);
      }

      // 3. Create WhatsApp Messages Table if it doesn't exist
      if (!messageTable) {
        const { data: newM, error: errM } = await supabase
          .from("tables")
          .insert({
            user_id: user.id,
            name: "رسائل واتساب Web",
            fields: JSON.stringify([
              { name: "Sender", type: "text" },
              { name: "Message", type: "text" },
              { name: "isMe", type: "text" }
            ])
          })
          .select()
          .single();

        if (errM) throw errM;
        messageTable = newM;

        // Insert initial message records
        await supabase.from("records").insert([
          {
            table_id: messageTable.id,
            user_id: user.id,
            data: JSON.stringify({ Sender: "أحمد (مصر)", Message: "أهلاً بك! لقد تم تصميم هذا القالب بمكون تمرير وتكامل تام لقاعدة البيانات.", isMe: "false" })
          },
          {
            table_id: messageTable.id,
            user_id: user.id,
            data: JSON.stringify({ Sender: "أنت", Message: "هذا رائع جداً! يمكننا تبادل ومزامنة الرسائل في الوقت الفعلي.", isMe: "true" })
          },
          {
            table_id: messageTable.id,
            user_id: user.id,
            data: JSON.stringify({ Sender: "أحمد (مصر)", Message: "صحيح، جرب إرسال رسالة بنفسك عبر مدخل النصوص بالأسفل!", isMe: "false" })
          }
        ]);
      }

      const contactId = contactTable.id;
      const messageId = messageTable.id;

      // 4. Define 3 Connected Pages
      const waPages: any[] = [
        // Page 1: Home (Chats List)
        {
          id: "home",
          name: "الدردشات (Chats List)",
          path: "/",
          elements: [
            {
              id: "bg_1",
              type: "divider",
              content: null,
              style: {
                width: "100%",
                height: "100%",
                backgroundColor: "#f0f2f5",
                position: "absolute",
                top: "0",
                left: "0",
                zIndex: -1,
                border: "none"
              },
              position: { x: 0, y: 0 }
            },
            {
              id: "header_panel",
              type: "section_block",
              content: "واتساب ويب المطور",
              style: {
                width: "100%",
                height: "70px",
                backgroundColor: "#008069",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0px 20px",
                borderRadius: "0px"
              },
              position: { x: 0, y: 0 }
            },
            {
              id: "title_text",
              type: "heading",
              content: "💬 واتساب ويب (الدردشات)",
              style: {
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: "bold"
              },
              position: { x: 20, y: 22 }
            },
            {
              id: "nav_to_contacts",
              type: "button",
              content: "👤 إضافة جهة اتصال جديدة",
              style: {
                backgroundColor: "#00a884",
                color: "#ffffff",
                padding: "8px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                border: "none",
                cursor: "pointer"
              },
              events: [
                {
                  trigger: "onClick",
                  actions: [
                    {
                      id: "act_1",
                      type: "navigate_page",
                      params: { url: "/contacts" }
                    }
                  ]
                }
              ],
              position: { x: 200, y: 15 }
            },
            {
              id: "label_stories",
              type: "label",
              content: "🟢 الحالات النشطة (قوالب التمرير Scroller):",
              style: {
                fontSize: "13px",
                color: "#008069",
                fontWeight: "bold",
                margin: "12px 16px 4px 16px"
              },
              position: { x: 16, y: 85 }
            },
            {
              id: "stories_scroller",
              type: "horizontal_list",
              dataSource: { tableId: contactId },
              dataMapping: { titleField: "Name", imageField: "Image" },
              style: {
                width: "100%",
                backgroundColor: "#ffffff",
                padding: "12px",
                borderBottom: "1px solid #e1e9f0",
                gap: "12px"
              },
              events: [
                {
                  trigger: "onClick",
                  actions: [
                    {
                      id: "act_2",
                      type: "navigate_page",
                      params: { url: "/chat" }
                    }
                  ]
                }
              ],
              position: { x: 0, y: 110 }
            },
            {
              id: "label_chats",
              type: "label",
              content: "💬 المحادثات الأخيرة (المزامنة لقاعدة البيانات):",
              style: {
                fontSize: "13px",
                color: "#667781",
                fontWeight: "bold",
                margin: "16px 16px 4px 16px"
              },
              position: { x: 16, y: 223 }
            },
            {
              id: "chats_list_db",
              type: "custom_list",
              dataSource: { tableId: contactId },
              dataMapping: { titleField: "Name", descriptionField: "Status", imageField: "Image" },
              style: {
                width: "100%",
                padding: "16px",
                borderRadius: "12px"
              },
              events: [
                {
                  trigger: "onClick",
                  actions: [
                    {
                      id: "act_3",
                      type: "navigate_page",
                      params: { url: "/chat" }
                    }
                  ]
                }
              ],
              position: { x: 0, y: 248 }
            }
          ]
        },
        // Page 2: Chat Room (/chat)
        {
          id: "chat_room",
          name: "غرفة الدردشة (Chat Room)",
          path: "/chat",
          elements: [
            {
              id: "bg_2",
              type: "divider",
              content: null,
              style: {
                width: "100%",
                height: "100%",
                backgroundColor: "#efeae2",
                position: "absolute",
                top: "0",
                left: "0",
                zIndex: -1,
                border: "none"
              },
              position: { x: 0, y: 0 }
            },
            {
              id: "chat_header_panel",
              type: "section_block",
              content: "محادثة واتساب مخصصة",
              style: {
                width: "100%",
                height: "70px",
                backgroundColor: "#008069",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0px 16px",
                borderRadius: "0px"
              },
              position: { x: 0, y: 0 }
            },
            {
              id: "back_btn",
              type: "button",
              content: "◀ الدردشات",
              style: {
                backgroundColor: "transparent",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.3)",
                cursor: "pointer"
              },
              events: [
                {
                  trigger: "onClick",
                  actions: [
                    {
                      id: "act_4",
                      type: "navigate_page",
                      params: { url: "/" }
                    }
                  ]
                }
              ],
              position: { x: 16, y: 18 }
            },
            {
              id: "chat_partner_name",
              type: "heading",
              content: "👤 محادثة مع: {{active_chat_name}}",
              style: {
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "bold",
                textAlign: "right"
              },
              position: { x: 120, y: 15 }
            },
            {
              id: "chat_partner_status",
              type: "label",
              content: "متصل الآن بالخادم الذكي ⚡",
              style: {
                color: "#d9fdd3",
                fontSize: "10px",
                textAlign: "right"
              },
              position: { x: 120, y: 40 }
            },
            {
              id: "bubble_renderer_db",
              type: "chat_bubble",
              dataSource: { tableId: messageId },
              content: [],
              style: {
                width: "100%",
                maxHeight: "380px",
                overflowY: "auto",
                backgroundColor: "transparent",
                gap: "8px"
              },
              position: { x: 0, y: 80 }
            },
            {
              id: "quick_message_form_db",
              type: "form",
              dataSource: { tableId: messageId },
              content: {
                title: "إرسال رسالة رد قاعدة البيانات:",
                buttonText: "إرسال ورقة الدردشة 🚀",
                fields: [
                  { name: "Sender", type: "hidden", value: "أنا" },
                  { name: "Message", type: "text", placeholder: "اكتب رسالتك للمزامنة..." },
                  { name: "isMe", type: "hidden", value: "true" }
                ]
              },
              style: {
                width: "100%",
                padding: "16px",
                backgroundColor: "#f0f2f5",
                borderRadius: "12px",
                border: "1px solid #e1e9f0",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)"
              },
              events: [
                {
                  trigger: "onSubmit",
                  actions: [
                    {
                      id: "act_refresh",
                      type: "navigate_page",
                      params: { url: "/chat" }
                    }
                  ]
                }
              ],
              position: { x: 0, y: 470 }
            }
          ]
        },
        // Page 3: Contacts (/contacts)
        {
          id: "add_contacts",
          name: "إضافة جهات اتصال (Contacts Setup)",
          path: "/contacts",
          elements: [
            {
              id: "bg_3",
              type: "divider",
              content: null,
              style: {
                width: "100%",
                height: "100%",
                backgroundColor: "#f8fafc",
                position: "absolute",
                top: "0",
                left: "0",
                zIndex: -1,
                border: "none"
              },
              position: { x: 0, y: 0 }
            },
            {
              id: "contacts_header_panel",
              type: "section_block",
              content: "contacts layout",
              style: {
                width: "100%",
                height: "70px",
                backgroundColor: "#008069",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0px 16px",
                borderRadius: "0px"
              },
              position: { x: 0, y: 0 }
            },
            {
              id: "back_btn_contacts",
              type: "button",
              content: "◀ إلغاء والعودة",
              style: {
                backgroundColor: "transparent",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "bold",
                border: "1px solid rgba(255,255,255,0.3)",
                cursor: "pointer"
              },
              events: [
                {
                  trigger: "onClick",
                  actions: [
                    {
                      id: "act_5",
                      type: "navigate_page",
                      params: { url: "/" }
                    }
                  ]
                }
              ],
              position: { x: 16, y: 18 }
            },
            {
              id: "contacts_title",
              type: "heading",
              content: "👤 أضف جهة اتصال لقاعدة البيانات",
              style: {
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "bold"
              },
              position: { x: 150, y: 22 }
            },
            {
              id: "contacts_form_db",
              type: "form",
              dataSource: { tableId: contactId },
              content: {
                title: "املأ بيانات الصديق الجديد ليتم حفظه ومزامنته فوراً:",
                buttonText: "إضافة جهة الاتصال 👤",
                fields: [
                  { name: "Name", type: "text", placeholder: "اسم جهة الاتصال (مثال: أمجد الحوسني)" },
                  { name: "Status", type: "text", placeholder: "الحالة (مثال: متواجد الآن 🟢)" },
                  { name: "Image", type: "text", placeholder: "رابط الصورة الشخصية (مثال: https://picsum.photos/seed/amjad/80/80)" }
                ]
              },
              style: {
                width: "90%",
                maxWidth: "450px",
                alignSelf: "center",
                padding: "24px",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)"
              },
              events: [
                {
                  trigger: "onSubmit",
                  actions: [
                    {
                      id: "act_6",
                      type: "navigate_page",
                      params: { url: "/" }
                    }
                  ]
                }
              ],
              position: { x: 20, y: 100 }
            }
          ]
        }
      ];

      setSitePages(waPages);
      setCurrentPageId("home");
      setElements(waPages[0].elements || []);

      setTimeout(async () => {
        const state = useBuilderStore.getState();
        await supabase
          .from("pages")
          .update({
            content: { 
              sitePages: waPages, 
              variables: state.variables,
              customDomain: customDomain || null
            },
          })
          .eq("id", id);
          
        alert("🎉 تم إعداد قاعدة البيانات جهات الاتصال والرسائل في Supabase ومزامنتها بنجاح مع 3 صفحات تفاعلية! يمكنك التحقق منها بالمعاينة الآن.");
      }, 500);

    } catch (e: any) {
      console.error(e);
      alert("حدث خطأ أثناء الاتصال بقاعدة البيانات: " + e.message);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!user || !id) return;
      const { data: docSnap, error } = await supabase
        .from("pages")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching page:", error);
        alert("Error fetching page: " + error.message);
        router.push("/dashboard");
        return;
      }
      if (docSnap) {
        if (docSnap.user_id === user.id) {
          setPageTitle(docSnap.title);
          setPageSlug(docSnap.slug);
          setPageDescription(docSnap.description || "");
          const content = typeof docSnap.content === 'string' ? JSON.parse(docSnap.content) : docSnap.content;
          setCustomDomain(content?.customDomain || "");
          
          if (content?.sitePages && content.sitePages.length > 0) {
            setSitePages(content.sitePages);
            setCurrentPageId(content.sitePages[0].id);
            setElements(content.sitePages[0].elements || []);
          } else {
            // Legacy single-page conversion
            const defaultPage = { id: 'home', name: 'Home', path: '/', elements: content?.elements || [] };
            setSitePages([defaultPage]);
            setCurrentPageId('home');
            setElements(defaultPage.elements);
          }
          setVariables(content?.variables || []);
        } else {
          alert(`You do not have permission to edit this page. User: ${user.id}, Page owner: ${docSnap.user_id}`);
          router.push("/dashboard");
        }
      } else {
        alert("Page not found");
        router.push("/dashboard");
      }
    };
    fetchPage();
  }, [id, user, router, setElements, setVariables, setCurrentPageId, setSitePages]);

  useEffect(() => {
    const fetchUserPagesAndTables = async () => {
      if (!user) return;

      const { data: snapPages } = await supabase
        .from("pages")
        .select("*")
        .eq("user_id", user.id);
        
      if (snapPages) {
        const pages = snapPages.map((d: any) => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
        }));
        setUserPages(pages);
      }

      const { data: snapTables } = await supabase
        .from("tables")
        .select("*")
        .eq("user_id", user.id);
        
      let tables: any[] = [];
      if (snapTables) {
        tables = snapTables.map((d: any) => ({
          id: d.id,
          name: d.name,
          fields: typeof d.fields === 'string' ? JSON.parse(d.fields || "[]") : d.fields,
        }));
      }

      // Add site_users as an available table
      tables.push({
        id: 'site_users',
        name: 'Users',
        fields: [
          { name: 'id', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'name', type: 'text' },
          { name: 'role', type: 'text' },
        ]
      });
      setUserTables(tables);

      const { data: settingsSnap } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
        
      if (settingsSnap) {
        setUserSettings(settingsSnap);
      }
    };
    fetchUserPagesAndTables();
  }, [user]);

  const handleSave = async (showSuccessAlert = false) => {
    if (!user || !id || isSavingRef.current) return;
    isSavingRef.current = true;
    setSaving(true);
    try {
      const state = useBuilderStore.getState();
      
      // Sync active elements into active site page
      const currentSitePages = state.sitePages.map(p => 
        p.id === state.currentPageId ? { ...p, elements: state.elements } : p
      );

      const { error } = await supabase
        .from("pages")
        .update({
          title: pageTitle,
          slug: pageSlug,
          description: pageDescription,
          content: { 
            sitePages: currentSitePages, 
            variables: state.variables,
            customDomain: customDomain || null
          },
        })
        .eq("id", id);
        
      if (error) throw error;
      
      // Update store so it has latest synced sitePages
      // Only update if different to avoid triggering subscription cycles or re-renders unnecessarily
      if (JSON.stringify(currentSitePages) !== JSON.stringify(state.sitePages)) {
        state.setSitePages(currentSitePages);
      }
      
      if (showSuccessAlert) {
         // Optionally use UI toast instead of alert for better UX, but simple alert is fine for manual clicks
         console.log('Page saved successfully!');
      }
    } catch (error: any) {
      console.error("Error saving page", error);
      if (showSuccessAlert) {
         alert('Error saving page: ' + error.message);
      }
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  };

  const handleSaveWithTimeout = async (showSuccessAlert = false) => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Save operation timed out')), 10000)
    );
    return Promise.race([handleSave(showSuccessAlert), timeoutPromise]);
  };

  const getPublicUrl = () => {
    let rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN;
    if (rootDomain) {
      rootDomain = rootDomain.replace(/^https?:\/\//, "");

      // Vercel and Cloud Run default domains do not support wildcard subdomains without custom domain setup
      if (
        rootDomain.endsWith(".vercel.app") ||
        rootDomain.endsWith(".run.app")
      ) {
        return `/${username || "user"}/${pageSlug}`;
      }

      const protocol = rootDomain.includes("localhost") ? "http" : "https";
      return `${protocol}://${username || "user"}.${rootDomain}/${pageSlug}`;
    }
    return `/${username || "user"}/${pageSlug}`;
  };

  const handlePublish = async () => {
    await handleSave();
    setShowPublishModal(true);
  };

  const copyToClipboard = () => {
    const url = getPublicUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Auto-save effect
  const handleSaveRef = useRef(handleSaveWithTimeout);
  handleSaveRef.current = handleSaveWithTimeout;
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!user || !id) return;

    let timeoutId: NodeJS.Timeout | null = null;
    const unsub = useBuilderStore.subscribe(
        (state) => [state.elements, state.variables, state.sitePages],
        ([elements, variables, sitePages], [prevElements, prevVariables, prevSitePages]) => {
          if (elements !== prevElements || variables !== prevVariables || sitePages !== prevSitePages) {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              if (!isSavingRef.current) {
                  handleSaveRef.current();
              }
            }, 2000);
          }
        },
        { equalityFn: (a, b) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] }
    );

    return () => {
      unsub();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, id]);

  const handleAddElement = (type: ElementType) => {
    // Add to center of canvas roughly
    addElement(type, { x: 50, y: 50 });
    setMobileView("canvas");
  };

  const selectedElement = useBuilderStore((s) =>
    s.elements.find((el) => el.id === s.selectedElementId),
  );

  const renderContentEditor = () => {
    if (!selectedElement) return null;

    switch (selectedElement.type) {
      case "divider":
      case "spacer":
        return <p className="text-sm text-gray-500">No content to edit.</p>;

      case "list":
      case "gallery":
      case "social":
      case "breadcrumbs":
      case "tags":
        return (
          <textarea
            value={(selectedElement.content as string[]).join("\n")}
            onChange={(e) =>
              updateElement(selectedElement.id, {
                content: e.target.value.split("\n"),
              })
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
            rows={4}
            placeholder="One item per line"
          />
        );

      case "progress":
        return (
          <input
            type="number"
            min="0"
            max="100"
            value={selectedElement.content as number}
            onChange={(e) =>
              updateElement(selectedElement.id, {
                content: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        );

      case "testimonial":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).quote}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    quote: e.target.value,
                  },
                })
              }
              placeholder="Quote"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).author}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    author: e.target.value,
                  },
                })
              }
              placeholder="Author"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).role}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    role: e.target.value,
                  },
                })
              }
              placeholder="Role"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );

      case "input":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Input Type</label>
              <select
                className="w-full px-3 py-2 border rounded-md text-sm"
                value={(selectedElement.content as any)?.type || "text"}
                onChange={(e) => updateElement(selectedElement.id, {
                  content: { ...(selectedElement.content as any), type: e.target.value }
                })}
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="password">Password</option>
                <option value="date">Date</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Placeholder</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.placeholder || ""}
                onChange={(e) => updateElement(selectedElement.id, {
                  content: { ...(selectedElement.content as any), placeholder: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Default Value</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.defaultValue || ""}
                onChange={(e) => updateElement(selectedElement.id, {
                  content: { ...(selectedElement.content as any), defaultValue: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Name / Key (اسم / مفتاح الإدخال)</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.name || ""}
                onChange={(e) => updateElement(selectedElement.id, {
                  content: { ...(selectedElement.content as any), name: e.target.value }
                })}
                placeholder="e.g. seat_number"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Form Group Key (رمز مجموعة نموذج لتجميع القيم)</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.groupId || ""}
                onChange={(e) => updateElement(selectedElement.id, {
                  content: { ...(selectedElement.content as any), groupId: e.target.value }
                })}
                placeholder="e.g. login_form"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Save to Variable (on change)</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.saveToVariable || ""}
                onChange={(e) => updateElement(selectedElement.id, {
                  content: { ...(selectedElement.content as any), saveToVariable: e.target.value }
                })}
                placeholder="e.g. seat_number"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Button Text</label>
              <input
                type="text"
                value={
                  typeof selectedElement.content === "object"
                    ? selectedElement.content?.text || ""
                    : selectedElement.content || ""
                }
                onChange={(e) => {
                  const currentContent = typeof selectedElement.content === "object" ? selectedElement.content : {};
                  updateElement(selectedElement.id, {
                    content: { ...currentContent, text: e.target.value },
                  });
                }}
                placeholder="Button Text"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-blue-600 block mb-1 font-semibold">🔗 Group Inputs (تجميع مدخلات المجموعة)</label>
              <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-md mb-2 text-xs text-blue-800 leading-normal">
                عند تحديد «رمز مجموعة النموذج» للزر ولمجموعة من مدخلات النصوص، سيقوم الزر تلقائياً بقراءة قيم كافة المدخلات وحفظها في متغيرات عامة باسم كل مدخل بالإضافة إلى المتغير العام المجمع عند النقر!
              </div>
              <label className="text-xs text-gray-500 block mb-1">Form Group Key to Collect (رمز مجموعة تجميع القيم)</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.groupId || ""}
                onChange={(e) => {
                  const currentContent = typeof selectedElement.content === "object" ? selectedElement.content : { text: selectedElement.content || "" };
                  updateElement(selectedElement.id, {
                    content: { ...currentContent, groupId: e.target.value },
                  });
                }}
                placeholder="e.g. login_form"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Save Combined Data to Variable (اسم متغير حفظ المجموع الكلي للقيم كـ Object)</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.saveToVariable || ""}
                onChange={(e) => {
                  const currentContent = typeof selectedElement.content === "object" ? selectedElement.content : { text: selectedElement.content || "" };
                  updateElement(selectedElement.id, {
                    content: { ...currentContent, saveToVariable: e.target.value },
                  });
                }}
                placeholder="e.g. form_values"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>
        );

      case "form":
      case "blank_form":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Form Title</label>
              <input
                type="text"
                value={(selectedElement.content as any).title}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    content: {
                      ...(selectedElement.content as any),
                      title: e.target.value,
                    },
                  })
                }
                placeholder="Form Title"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Button Text</label>
              <input
                type="text"
                value={(selectedElement.content as any).buttonText}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    content: {
                      ...(selectedElement.content as any),
                      buttonText: e.target.value,
                    },
                  })
                }
                placeholder="Button Text"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            {selectedElement.type === "blank_form" && (
              <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-2.5 rounded-md">
                <b>💡 Blank Form (Container)</b>: This is a container for holding form elements. Put form fields inside the card/block style or use global page layout variables to build custom form submissions!
              </div>
            )}
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).plan}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    plan: e.target.value,
                  },
                })
              }
              placeholder="Plan Name"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).price}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    price: e.target.value,
                  },
                })
              }
              placeholder="Price"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <label className="block text-xs text-gray-500 mt-2">
              Features (one per line)
            </label>
            <textarea
              value={(
                (selectedElement.content as any).features as string[]
              ).join("\n")}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    features: e.target.value.split("\n"),
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={4}
            />
          </div>
        );

      case "accordion":
        return (
          <div className="space-y-4">
            {(selectedElement.content as any[]).map((item, index) => (
              <div
                key={index}
                className="space-y-2 border p-2 rounded-md relative"
              >
                <button
                  onClick={() => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent.splice(index, 1);
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  className="absolute top-1 right-1 text-red-500 text-xs"
                >
                  X
                </button>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent[index].title = e.target.value;
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  placeholder="Title"
                  className="w-full px-2 py-1 border rounded-md text-sm"
                />
                <textarea
                  value={item.content}
                  onChange={(e) => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent[index].content = e.target.value;
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  placeholder="Content"
                  className="w-full px-2 py-1 border rounded-md text-sm"
                  rows={2}
                />
              </div>
            ))}
            <button
              onClick={() =>
                updateElement(selectedElement.id, {
                  content: [
                    ...(selectedElement.content as any[]),
                    { title: "New Item", content: "New Content" },
                  ],
                })
              }
              className="w-full py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200"
            >
              + Add Item
            </button>
          </div>
        );

      case "table":
        return (
          <div className="space-y-2">
            <label className="block text-xs text-gray-500">
              Headers (comma separated)
            </label>
            <input
              type="text"
              value={(
                (selectedElement.content as any).headers as string[]
              ).join(",")}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    headers: e.target.value.split(","),
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <label className="block text-xs text-gray-500 mt-2">
              Rows (one row per line, comma separated columns)
            </label>
            <textarea
              value={((selectedElement.content as any).rows as string[][])
                .map((row) => row.join(","))
                .join("\n")}
              onChange={(e) => {
                const rows = e.target.value
                  .split("\n")
                  .map((row) => row.split(","));
                updateElement(selectedElement.id, {
                  content: { ...(selectedElement.content as any), rows },
                });
              }}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={4}
            />
          </div>
        );

      case "hero":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).title}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    title: e.target.value,
                  },
                })
              }
              placeholder="Title"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).subtitle}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    subtitle: e.target.value,
                  },
                })
              }
              placeholder="Subtitle"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).buttonText}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    buttonText: e.target.value,
                  },
                })
              }
              placeholder="Button Text"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );
      case "stat":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).value}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    value: e.target.value,
                  },
                })
              }
              placeholder="Value"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).label}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    label: e.target.value,
                  },
                })
              }
              placeholder="Label"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );
      case "steps":
        return (
          <div className="space-y-4">
            {(selectedElement.content as any[]).map((item, index) => (
              <div
                key={index}
                className="space-y-2 border p-2 rounded-md relative"
              >
                <button
                  onClick={() => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent.splice(index, 1);
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  className="absolute top-1 right-1 text-red-500 text-xs"
                >
                  X
                </button>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent[index].title = e.target.value;
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  placeholder="Title"
                  className="w-full px-2 py-1 border rounded-md text-sm"
                />
                <textarea
                  value={item.description}
                  onChange={(e) => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent[index].description = e.target.value;
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  placeholder="Description"
                  className="w-full px-2 py-1 border rounded-md text-sm"
                  rows={2}
                />
              </div>
            ))}
            <button
              onClick={() =>
                updateElement(selectedElement.id, {
                  content: [
                    ...(selectedElement.content as any[]),
                    { title: "New Step", description: "Description" },
                  ],
                })
              }
              className="w-full py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200"
            >
              + Add Step
            </button>
          </div>
        );
      case "rating":
        return (
          <input
            type="number"
            min="0"
            max="5"
            value={selectedElement.content as number}
            onChange={(e) =>
              updateElement(selectedElement.id, {
                content: Number(e.target.value),
              })
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        );
      case "newsletter":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).title}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    title: e.target.value,
                  },
                })
              }
              placeholder="Title"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).placeholder}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    placeholder: e.target.value,
                  },
                })
              }
              placeholder="Placeholder"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).buttonText}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    buttonText: e.target.value,
                  },
                })
              }
              placeholder="Button Text"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );
      case "profile":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).name}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    name: e.target.value,
                  },
                })
              }
              placeholder="Name"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).role}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    role: e.target.value,
                  },
                })
              }
              placeholder="Role"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).avatarUrl}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    avatarUrl: e.target.value,
                  },
                })
              }
              placeholder="Avatar URL"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <textarea
              value={(selectedElement.content as any).bio}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    bio: e.target.value,
                  },
                })
              }
              placeholder="Bio"
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
            />
          </div>
        );
      case "banner":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).text}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    text: e.target.value,
                  },
                })
              }
              placeholder="Banner Text"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).link}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    link: e.target.value,
                  },
                })
              }
              placeholder="Link URL"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );
      case "footer":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).copyright}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    copyright: e.target.value,
                  },
                })
              }
              placeholder="Copyright Text"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <label className="block text-xs text-gray-500 mt-2">
              Links (one per line)
            </label>
            <textarea
              value={((selectedElement.content as any).links as string[]).join(
                "\n",
              )}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    links: e.target.value.split("\n"),
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={4}
            />
          </div>
        );
      case "logo":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).url}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    url: e.target.value,
                  },
                })
              }
              placeholder="Image URL"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              value={(selectedElement.content as any).alt}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    alt: e.target.value,
                  },
                })
              }
              placeholder="Alt Text"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );
      case "callout":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).emoji}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    emoji: e.target.value,
                  },
                })
              }
              placeholder="Emoji"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <textarea
              value={(selectedElement.content as any).text}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    text: e.target.value,
                  },
                })
              }
              placeholder="Text"
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
            />
          </div>
        );
      case "checklist":
        return (
          <div className="space-y-4">
            {(selectedElement.content as any[]).map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 border p-2 rounded-md relative"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent[index].checked = e.target.checked;
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent[index].text = e.target.value;
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  placeholder="Task"
                  className="flex-1 px-2 py-1 border rounded-md text-sm"
                />
                <button
                  onClick={() => {
                    const newContent = [...(selectedElement.content as any[])];
                    newContent.splice(index, 1);
                    updateElement(selectedElement.id, { content: newContent });
                  }}
                  className="text-red-500 text-xs"
                >
                  X
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                updateElement(selectedElement.id, {
                  content: [
                    ...(selectedElement.content as any[]),
                    { text: "New Task", checked: false },
                  ],
                })
              }
              className="w-full py-1 bg-gray-100 text-sm rounded-md hover:bg-gray-200"
            >
              + Add Task
            </button>
          </div>
        );
      case "toggle":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(selectedElement.content as any).checked}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    content: {
                      ...(selectedElement.content as any),
                      checked: e.target.checked,
                    },
                  })
                }
              />
              <label className="text-sm">Is Checked</label>
            </div>
            <input
              type="text"
              value={(selectedElement.content as any).label}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    label: e.target.value,
                  },
                })
              }
              placeholder="Label"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );
      case "auth_form":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).title}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    title: e.target.value,
                  },
                })
              }
              placeholder="Form Title"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <select
              value={(selectedElement.content as any).mode}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    mode: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
            >
              <option value="signup">Sign Up</option>
              <option value="login">Login</option>
            </select>
            <input
              type="text"
              value={(selectedElement.content as any).buttonText}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    buttonText: e.target.value,
                  },
                })
              }
              placeholder="Button Text"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
        );

      case "loading_screen":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={(selectedElement.content as any).message}
              onChange={(e) =>
                updateElement(selectedElement.id, {
                  content: {
                    ...(selectedElement.content as any),
                    message: e.target.value,
                  },
                })
              }
              placeholder="Loading Message"
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(selectedElement.content as any).showSpinner}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    content: {
                      ...(selectedElement.content as any),
                      showSpinner: e.target.checked,
                    },
                  })
                }
              />
              <label className="text-sm">Show Spinner</label>
            </div>
          </div>
        );
      case "code":
      case "quote":
      case "text":
      case "section_block":
        return (
          <textarea
            value={selectedElement.content as string}
            onChange={(e) =>
              updateElement(selectedElement.id, { content: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md text-sm ${selectedElement.type === 'code' ? 'font-mono' : ''}`}
            rows={selectedElement.type === 'text' ? 4 : 6}
          />
        );
      case "image":
      case "video":
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={selectedElement.content as string}
              onChange={(e) =>
                updateElement(selectedElement.id, { content: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md text-sm"
              placeholder={`${selectedElement.type === "image" ? "Image" : "Video"} URL`}
            />
            {selectedElement.type === "image" && (
                <div className="pt-2">
                  <SupabaseUploadWidget
                    onSuccess={(url) =>
                      updateElement(selectedElement.id, { content: url })
                    }
                    className="w-full"
                  />
                </div>
              )}
          </div>
        );
      case "file_upload":
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">تسمية المكون (Label Text)</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.label || "Upload Document"}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    content: {
                      ...((selectedElement.content as any) || {}),
                      label: e.target.value,
                    },
                  })
                }
                placeholder="Upload Document / تحميل ملف"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">نص زر الرفع (Button Text)</label>
              <input
                type="text"
                value={(selectedElement.content as any)?.buttonText || "Choose File"}
                onChange={(e) =>
                  updateElement(selectedElement.id, {
                    content: {
                      ...((selectedElement.content as any) || {}),
                      buttonText: e.target.value,
                    },
                  })
                }
                placeholder="Choose File / اختيار الملف"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
            
            <div className="text-xs text-blue-600 bg-blue-50 border border-blue-200 p-2.5 rounded-md text-left">
              <b>📁 عنصر تحميل الملفات والاتصال بقاعدة البيانات</b>:
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li>قم بتمكين {'"Database Connection"'} بالأسفل ليرتبط بجدول قاعدة بيانات.</li>
                <li>عندما يقوم الزوار بزيارة موقعك ورفع ملف، سيتم تخزين الملف في Supabase Storage وحفظ رابطه في العمود المختار من الجدول!</li>
              </ul>
            </div>
          </div>
        );

      default:
        if (typeof selectedElement.content === "object") {
          return (
            <textarea
              value={JSON.stringify(selectedElement.content, null, 2)}
              onChange={(e) => {
                try {
                  const updated = JSON.parse(e.target.value);
                  updateElement(selectedElement.id, { content: updated });
                } catch (err) {
                  // Wait for valid JSON
                }
              }}
              className="w-full px-3 py-2 border rounded-md text-sm font-mono"
              rows={8}
            />
          );
        }
        return (
          <input
            type="text"
            value={selectedElement.content as string}
            onChange={(e) =>
              updateElement(selectedElement.id, { content: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        );
    }
  };

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Topbar */}
      <header className="h-14 bg-white border-b flex items-center justify-between px-4 shrink-0 overflow-x-auto">
        <div className="flex items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-md mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="font-semibold text-gray-800 hidden sm:block whitespace-nowrap">
            {pageTitle}
          </h1>
        </div>

        <div className="flex items-center space-x-1 mx-4">
          <button
            onClick={() => setTopTab("editor")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${topTab === "editor" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            Editor
          </button>
          <button
            onClick={() => setTopTab("database")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${topTab === "database" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            Database
          </button>
          <button
            onClick={() => setTopTab("users")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${topTab === "users" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            Users
          </button>
          <button
            onClick={() => setTopTab("settings")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${topTab === "settings" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"}`}
          >
            Settings
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={applyWhatsAppTemplate}
            className="bg-emerald-600 text-white px-3 py-2 rounded-md flex items-center text-sm font-medium hover:bg-emerald-700 transition"
          >
            <Smartphone className="w-4 h-4 mr-1.5" /> قالب واتساب (WhatsApp Template)
          </button>
          <a
            href={getPublicUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md flex items-center text-sm hover:bg-gray-200 transition"
          >
            Preview
          </a>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-md flex items-center text-sm hover:bg-purple-700 transition"
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handlePublish}
            disabled={saving}
            className="bg-green-600 text-white px-4 py-2 rounded-md flex items-center text-sm hover:bg-green-700 disabled:opacity-50 transition"
          >
            <Send className="w-4 h-4 mr-2" /> Publish
          </button>
        </div>
      </header>

      {topTab === "editor" && (
        <>
          <div className="flex flex-1 overflow-hidden relative">
            {/* Sidebar */}
            <aside
              className={`${mobileView === "elements" ? "flex" : "hidden"} md:flex absolute md:relative z-10 w-full md:w-64 h-full bg-white border-r flex-col shrink-0 overflow-hidden`}
            >
              <div className="flex border-b shrink-0 overflow-x-auto">
                <button
                  onClick={() => setLeftTab("pages")}
                  className={`flex-1 min-w-[70px] py-3 px-2 text-xs font-semibold uppercase tracking-wider ${leftTab === "pages" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                >
                  Pages
                </button>
                <button
                  onClick={() => setLeftTab("elements")}
                  className={`flex-1 min-w-[70px] py-3 px-2 text-xs font-semibold uppercase tracking-wider ${leftTab === "elements" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                >
                  Elements
                </button>
                <button
                  onClick={() => setLeftTab("variables")}
                  className={`flex-1 min-w-[70px] py-3 px-2 text-xs font-semibold uppercase tracking-wider ${leftTab === "variables" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                >
                  Vars
                </button>
              </div>

              <div className="flex-1 overflow-y-auto hidden-scrollbar">
                {leftTab === "pages" && (
                  <div className="p-4 space-y-4">
                    <button
                      onClick={() => {
                        const name = prompt("Enter page name (e.g. About Us)");
                        if (name) {
                          const defaultPath = '/' + name.toLowerCase().replace(/\s+/g, '-');
                          let path = prompt("Enter page path (e.g. /about)", defaultPath);
                          if (path) {
                            if (!path.startsWith('/')) path = '/' + path;
                            addSitePage(name, path);
                          }
                        }
                      }}
                      className="w-full py-2 bg-blue-50 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Page
                    </button>
                    <div className="space-y-2">
                      {sitePages.map((page) => (
                        <div
                          key={page.id}
                          className={`group flex items-center justify-between p-2 rounded-md cursor-pointer transition ${currentPageId === page.id ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50 border border-transparent"}`}
                          onClick={() => {
                            if (currentPageId !== page.id) {
                              // Save current elements to the current page before switching
                              updateSitePage(currentPageId, { elements: useBuilderStore.getState().elements });
                              setCurrentPageId(page.id);
                              setElements(page.elements || []);
                            }
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">{page.name}</span>
                            <span className="text-xs text-gray-500 font-mono">{page.path}</span>
                          </div>
                          {sitePages.length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Delete this page?")) {
                                  let nextId = sitePages.find((p) => p.id !== page.id)?.id;
                                  if (currentPageId === page.id && nextId) {
                                    setCurrentPageId(nextId);
                                    setElements(sitePages.find((p) => p.id === nextId)?.elements || []);
                                  }
                                  removeSitePage(page.id);
                                }
                              }}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {leftTab === "elements" && (
                  <div className="p-4 space-y-6">
                    {SIDEBAR_CATEGORIES.map((category) => (
                      <div key={category.name}>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          {category.name}
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {category.items.map((item) => (
                            <button
                              key={item.type}
                              onClick={() => handleAddElement(item.type)}
                              className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-blue-50 transition bg-gray-100/60 text-gray-700"
                            >
                              <item.icon className="w-6 h-6 text-gray-600 mb-2" />
                              <span className="text-xs text-gray-700">
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {leftTab === "variables" && (
                  <div className="p-4 space-y-4">
                    <button
                      onClick={() => {
                        const id = prompt(
                          "Enter a variable name (e.g. currentUserId)",
                        );
                        if (id) {
                          setVariables([
                            ...variables,
                            { id, name: id, type: "string", defaultValue: "" },
                          ]);
                        }
                      }}
                      className="w-full py-2 bg-blue-50 text-blue-600 rounded-md text-sm border border-blue-200 font-semibold mb-4 hover:bg-blue-100"
                    >
                      + Add Variable
                    </button>
                    {variables.map((v, i) => (
                      <div
                        key={v.id}
                        className="border rounded-md p-3 space-y-2 bg-gray-50"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm">
                            {v.name}
                          </span>
                          <button
                            onClick={() =>
                              setVariables(
                                variables.filter((vr) => vr.id !== v.id),
                              )
                            }
                            className="text-red-500 text-xs"
                          >
                            Del
                          </button>
                        </div>
                        <select
                          value={v.type}
                          onChange={(e) => {
                            const next = [...variables];
                            next[i].type = e.target.value as any;
                            setVariables(next);
                          }}
                          className="w-full px-2 py-1 border text-xs rounded"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="boolean">Boolean</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Default Value"
                          value={v.defaultValue}
                          onChange={(e) => {
                            const next = [...variables];
                            next[i].defaultValue = e.target.value;
                            setVariables(next);
                          }}
                          className="w-full px-2 py-1 border text-xs rounded"
                        />
                      </div>
                    ))}
                    {variables.length > 0 && (
                      <div className="text-xs text-gray-500 p-2 bg-yellow-50 rounded-md border border-yellow-100 italic mt-4">
                        Hint: Use <strong>{"{{variableName}}"}</strong> in any
                        text element or button to bind this variable
                        dynamically.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </aside>

            {/* Canvas */}
            <main
              className={`${mobileView === "canvas" ? "flex" : "hidden"} md:flex flex-1 relative overflow-auto bg-white`}
              onClick={() => selectElement(null)}
            >
              <div
                ref={canvasRef}
                className="w-full h-full min-h-screen bg-white relative overflow-hidden"
              >
                <BuilderCanvasMap
                  canvasRef={canvasRef}
                  setMobileView={setMobileView}
                />
              </div>
            </main>

            {/* Inspector */}
            <aside
              className={`${mobileView === "properties" ? "flex" : "hidden"} md:flex absolute md:relative right-0 z-10 w-full md:w-80 h-full bg-white border-l flex-col shrink-0 overflow-y-auto`}
            >
              <div className="p-4 border-b">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Properties
                </h2>
              </div>
              {selectedElement ? (
                <div className="p-4 space-y-6">
                  {/* Content Edit */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    {renderContentEditor()}
                  </div>

                  {/* Style Edit */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                      Style
                    </h3>

                    {selectedElement.style?.color !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.style?.color || '#000000'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                color: e.target.value,
                              },
                            })
                          }
                          className="w-full h-8 cursor-pointer"
                        />
                      </div>
                    )}

                    {selectedElement.style?.backgroundColor !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.style?.backgroundColor || '#ffffff'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                backgroundColor: e.target.value,
                              },
                            })
                          }
                          className="w-full h-8 cursor-pointer"
                        />
                      </div>
                    )}

                    {selectedElement.style?.fontSize !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={selectedElement.style?.fontSize || '16px'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                fontSize: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    )}

                    {/* Position and Animation Edit */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-900 border-b pb-2">
                        Position & Animation
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            X Position (px)
                          </label>
                          <input
                            type="number"
                            value={selectedElement.position?.x || 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, {
                                position: {
                                  ...selectedElement.position,
                                  x: Number(e.target.value),
                                  y: selectedElement.position?.y || 0,
                                },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">
                            Y Position (px)
                          </label>
                          <input
                            type="number"
                            value={selectedElement.position?.y || 0}
                            onChange={(e) =>
                              updateElement(selectedElement.id, {
                                position: {
                                  ...selectedElement.position,
                                  x: selectedElement.position?.x || 0,
                                  y: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-2 border rounded-md text-sm"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Width
                        </label>
                        <input
                          type="text"
                          value={selectedElement.style?.width || 'auto'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                width: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="e.g. 100px, 100%, w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Height
                        </label>
                        <input
                          type="text"
                          value={selectedElement.style?.height || 'auto'}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                height: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder="e.g. 100px, auto"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Animation
                        </label>
                        <select
                          value={(selectedElement.customCss || "").match(/animate-[a-zA-Z0-9_-]+/)?.[0] || ""}
                          onChange={(e) => {
                            let currentClasses = selectedElement.customCss || "";
                            currentClasses = currentClasses.replace(/animate-[a-zA-Z0-9_-]+/g, "").trim();
                            if (e.target.value) {
                              currentClasses = `${currentClasses} ${e.target.value}`.trim();
                            }
                            updateElement(selectedElement.id, {
                              customCss: currentClasses,
                            });
                          }}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">None</option>
                          <option value="animate-fadeIn">Fade In</option>
                          <option value="animate-fadeInDown">Fade In Down</option>
                          <option value="animate-fadeInUp">Fade In Up</option>
                          <option value="animate-bounce">Bounce</option>
                          <option value="animate-pulse">Pulse</option>
                          <option value="animate-zoomIn">Zoom In</option>
                          <option value="animate-slideInLeft">Slide In Left</option>
                          <option value="animate-slideInRight">Slide In Right</option>
                          <option value="animate-flip">Flip</option>
                          <option value="animate-heartBeat">Heartbeat</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Database Connection */}
                  {(selectedElement.type === "list" ||
                    selectedElement.type === "simple_list" ||
                    selectedElement.type === "card_list" ||
                    selectedElement.type === "image_list" ||
                    selectedElement.type === "masonry_list" ||
                    selectedElement.type === "horizontal_list" ||
                    selectedElement.type === "custom_list" ||
                    selectedElement.type === "form" ||
                    selectedElement.type === "text" ||
                    selectedElement.type === "image" ||
                    selectedElement.type === "button" ||
                    selectedElement.type === "exam_result_lookup" ||
                    selectedElement.type === "search" ||
                    selectedElement.type === "file_upload" ||
                    selectedElement.type === "label") && (
                    <div className="space-y-4 mt-4 border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Database Connection
                      </h3>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          🔗 Connect to Multiple Collections / Databases (الاتصال بقواعد بيانات متعددة)
                        </label>
                        <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 border rounded-md bg-gray-50">
                          {/* Option for Files */}
                          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                            <input
                              type="checkbox"
                              checked={
                                selectedElement.dataSource?.tableId === "files" ||
                                (selectedElement.dataSources || []).some((ds: any) => ds.tableId === "files")
                              }
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                  if (!selectedElement.dataSource?.tableId) {
                                    updateElement(selectedElement.id, {
                                      dataSource: { tableId: "files" }
                                    });
                                  } else {
                                    const currentDS = selectedElement.dataSources || [];
                                    if (!currentDS.some((ds: any) => ds.tableId === "files")) {
                                      updateElement(selectedElement.id, {
                                        dataSources: [...currentDS, { tableId: "files" }]
                                      });
                                    }
                                  }
                                } else {
                                  if (selectedElement.dataSource?.tableId === "files") {
                                    const nextDS = selectedElement.dataSources || [];
                                    if (nextDS.length > 0) {
                                      const [first, ...rest] = nextDS;
                                      updateElement(selectedElement.id, {
                                        dataSource: { tableId: first.tableId },
                                        dataSources: rest
                                      });
                                    } else {
                                      updateElement(selectedElement.id, {
                                        dataSource: { tableId: "" }
                                      });
                                    }
                                  } else {
                                    updateElement(selectedElement.id, {
                                      dataSources: (selectedElement.dataSources || []).filter(
                                        (ds: any) => ds.tableId !== "files"
                                      )
                                    });
                                  }
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                            />
                            <span>files (Media Storage Uploads)</span>
                          </label>

                          {userTables.map((t) => (
                            <label key={t.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer hover:bg-white p-1 rounded transition-colors">
                              <input
                                type="checkbox"
                                checked={
                                  selectedElement.dataSource?.tableId === t.id ||
                                  (selectedElement.dataSources || []).some((ds: any) => ds.tableId === t.id)
                                }
                                onChange={(e) => {
                                  const isChecked = e.target.checked;
                                  if (isChecked) {
                                    if (!selectedElement.dataSource?.tableId) {
                                      updateElement(selectedElement.id, {
                                        dataSource: { tableId: t.id }
                                      });
                                    } else {
                                      const currentDS = selectedElement.dataSources || [];
                                      if (!currentDS.some((ds: any) => ds.tableId === t.id)) {
                                        updateElement(selectedElement.id, {
                                          dataSources: [...currentDS, { tableId: t.id }]
                                        });
                                      }
                                    }
                                  } else {
                                    if (selectedElement.dataSource?.tableId === t.id) {
                                      const nextDS = selectedElement.dataSources || [];
                                      if (nextDS.length > 0) {
                                        const [first, ...rest] = nextDS;
                                        updateElement(selectedElement.id, {
                                          dataSource: { tableId: first.tableId },
                                          dataSources: rest
                                        });
                                      } else {
                                        updateElement(selectedElement.id, {
                                          dataSource: { tableId: "" }
                                        });
                                      }
                                    } else {
                                      updateElement(selectedElement.id, {
                                        dataSources: (selectedElement.dataSources || []).filter(
                                          (ds: any) => ds.tableId !== t.id
                                        )
                                      });
                                    }
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                              />
                              <span>{t.name} ({t.id})</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">
                          يمكنك اختيار أكثر من قاعدة بيانات/مجموعة في نفس الوقت. سيقوم المكون بدمج البيانات من كافة المصادر المحددة وعرضها كقائمة واحدة متكاملة!
                        </p>
                      </div>
                      {selectedElement.dataSource?.tableId &&
                        (selectedElement.type === "text" || 
                         selectedElement.type === "label" || 
                         selectedElement.type === "image" ||
                         selectedElement.type === "button") && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-100 mt-2">
                            Bind single record. Example: Use <b>{"{{CurrentItem.field_name}}"}</b> in content/text/URL to render dynamically.
                            <div className="mt-2">
                              <p className="font-semibold mb-1">Available Properties (click to copy):</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedElement.dataSource?.tableId === "files" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(`{{CurrentItem.name}}`)}
                                      className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] hover:bg-gray-200"
                                    >
                                      name
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(`{{CurrentItem.url}}`)}
                                      className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] hover:bg-gray-200"
                                    >
                                      url
                                    </button>
                                  </>
                                ) : (
                                  userTables
                                    .find((t) => t.id === selectedElement.dataSource?.tableId)
                                    ?.fields?.map((field: any) => (
                                      <button
                                        key={field.name}
                                        type="button"
                                        onClick={() => navigator.clipboard.writeText(`{{CurrentItem.${field.name}}}`)}
                                        className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] hover:bg-gray-200"
                                      >
                                        {field.name}
                                      </button>
                                    ))
                                )}
                              </div>
                            </div>
                          </div>
                      )}
                      {selectedElement.dataSource?.tableId &&
                         (selectedElement.type === "list" ||
                          selectedElement.type === "simple_list" ||
                          selectedElement.type === "card_list" ||
                          selectedElement.type === "image_list" ||
                          selectedElement.type === "masonry_list" ||
                          selectedElement.type === "horizontal_list" ||
                          selectedElement.type === "custom_list") && (
                           <div className="space-y-3 mt-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-left">
                             <div className="text-xs text-blue-700 font-semibold mb-1">
                               📂 ربط الحقول وعرض البيانات المخصصة (Fields Mapping)
                             </div>
                             
                             {/* Title Field mapping */}
                             <div>
                               <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                 📌 حقل العنوان (Title/Header representation)
                               </label>
                               <select
                                 value={selectedElement.dataMapping?.titleField || ""}
                                 onChange={(e) => {
                                   const currentMapping = selectedElement.dataMapping || {};
                                   updateElement(selectedElement.id, {
                                     dataMapping: { ...currentMapping, titleField: e.target.value }
                                   });
                                 }}
                                 className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800"
                               >
                                 <option value="">-- تلقائي (حسب اسم الحقل) --</option>
                                 {(() => {
                                   const tableIds = [selectedElement.dataSource.tableId];
                                   if (Array.isArray(selectedElement.dataSources)) {
                                     selectedElement.dataSources.forEach((ds: any) => {
                                       if (ds?.tableId && !tableIds.includes(ds.tableId)) tableIds.push(ds.tableId);
                                     });
                                   }
                                   const uniqFields: string[] = [];
                                   tableIds.forEach((tId) => {
                                     if (tId === "files") {
                                       ["name", "url", "created_at"].forEach(f => { if (!uniqFields.includes(f)) uniqFields.push(f); });
                                     } else {
                                       const table = userTables.find(t => t.id === tId);
                                       if (table && Array.isArray(table.fields)) {
                                         table.fields.forEach(f => { if (!uniqFields.includes(f.name)) uniqFields.push(f.name); });
                                       }
                                     }
                                   });
                                   return uniqFields.map(f => (
                                     <option key={f} value={f}>{f}</option>
                                   ));
                                 })()}
                               </select>
                             </div>

                             {/* Description Field mapping */}
                             <div>
                               <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                 📝 حقل الوصف والشرائح (Description / Details representation)
                               </label>
                               <select
                                 value={selectedElement.dataMapping?.descriptionField || ""}
                                 onChange={(e) => {
                                   const currentMapping = selectedElement.dataMapping || {};
                                   updateElement(selectedElement.id, {
                                     dataMapping: { ...currentMapping, descriptionField: e.target.value }
                                   });
                                 }}
                                 className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800"
                               >
                                 <option value="">-- تلقائي (حسب اسم الحقل) --</option>
                                 {(() => {
                                   const tableIds = [selectedElement.dataSource.tableId];
                                   if (Array.isArray(selectedElement.dataSources)) {
                                     selectedElement.dataSources.forEach((ds: any) => {
                                       if (ds?.tableId && !tableIds.includes(ds.tableId)) tableIds.push(ds.tableId);
                                     });
                                   }
                                   const uniqFields: string[] = [];
                                   tableIds.forEach((tId) => {
                                     if (tId === "files") {
                                       ["name", "url", "created_at"].forEach(f => { if (!uniqFields.includes(f)) uniqFields.push(f); });
                                     } else {
                                       const table = userTables.find(t => t.id === tId);
                                       if (table && Array.isArray(table.fields)) {
                                         table.fields.forEach(f => { if (!uniqFields.includes(f.name)) uniqFields.push(f.name); });
                                       }
                                     }
                                   });
                                   return uniqFields.map(f => (
                                     <option key={f} value={f}>{f}</option>
                                   ));
                                 })()}
                               </select>
                             </div>

                             {/* Image Field mapping */}
                             <div>
                               <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                 🖼️ حقل الصورة (Image/Url property representation)
                               </label>
                               <select
                                 value={selectedElement.dataMapping?.imageField || ""}
                                 onChange={(e) => {
                                   const currentMapping = selectedElement.dataMapping || {};
                                   updateElement(selectedElement.id, {
                                     dataMapping: { ...currentMapping, imageField: e.target.value }
                                   });
                                 }}
                                 className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800"
                               >
                                 <option value="">-- تلقائي (أو أول رابط صور متاح) --</option>
                                 {(() => {
                                   const tableIds = [selectedElement.dataSource.tableId];
                                   if (Array.isArray(selectedElement.dataSources)) {
                                     selectedElement.dataSources.forEach((ds: any) => {
                                       if (ds?.tableId && !tableIds.includes(ds.tableId)) tableIds.push(ds.tableId);
                                     });
                                   }
                                   const uniqFields: string[] = [];
                                   tableIds.forEach((tId) => {
                                     if (tId === "files") {
                                       ["url", "name"].forEach(f => { if (!uniqFields.includes(f)) uniqFields.push(f); });
                                     } else {
                                       const table = userTables.find(t => t.id === tId);
                                       if (table && Array.isArray(table.fields)) {
                                         table.fields.forEach(f => { if (!uniqFields.includes(f.name)) uniqFields.push(f.name); });
                                       }
                                     }
                                   });
                                   return uniqFields.map(f => (
                                     <option key={f} value={f}>{f}</option>
                                   ));
                                 })()}
                               </select>
                             </div>

                             <p className="text-[10px] text-gray-500 bg-white/50 p-1.5 rounded border border-gray-200 mt-1">
                               💡 قم باختيار أي حقل من حقول قاعدة البيانات ليتم عرضه تلقائيًا كعنوان، أو وصف، أو صورة لكل عنصر من عناصر هذه القوائم المدمجة!
                             </p>
                           </div>
                      )}
                      {selectedElement.dataSource?.tableId &&
                        selectedElement.type === "form" && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
                            Form is linked. When submitted, a record will be
                            added to{" "}
                            <b>
                              {
                                userTables.find(
                                  (t) =>
                                    t.id ===
                                    selectedElement.dataSource?.tableId,
                                )?.name
                              }
                            </b>
                            .
                          </div>
                        )}
                      {selectedElement.dataSource?.tableId &&
                        selectedElement.type === "exam_result_lookup" && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
                            Exam Lookup linked to{" "}
                            <b>
                              {
                                userTables.find(
                                  (t) =>
                                    t.id ===
                                    selectedElement.dataSource?.tableId,
                                )?.name
                              }
                            </b>
                            . Ensure your table has fields: <i>student_name, seat_number, total_score, max_score, percentage, status</i>.
                          </div>
                        )}
                      {selectedElement.dataSource?.tableId &&
                        selectedElement.type === "search" && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md border border-green-100 mt-2">
                            Search Element linked to{" "}
                            <b>
                              {
                                userTables.find(
                                  (t) =>
                                    t.id ===
                                    selectedElement.dataSource?.tableId,
                                )?.name
                              }
                            </b>
                            . It will search across all text fields of this collection.
                          </div>
                        )}
                      {selectedElement.dataSource?.tableId &&
                        selectedElement.type === "file_upload" && (
                          <div className="space-y-3 mt-3 p-3 bg-green-50/50 rounded-lg border border-green-100 text-left">
                            <div className="text-xs text-green-700 font-semibold mb-1">
                              📁 إعدادات حفظ الملف في قاعدة البيانات (File Upload Database Settings)
                            </div>
                            <div>
                              <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                📌 الحقل المستهدف لحفظ رابط الملف (Destination Field for File URL)
                              </label>
                              <select
                                value={selectedElement.dataSource?.fieldName || "url"}
                                onChange={(e) => {
                                  const currentDS = selectedElement.dataSource || { tableId: "" };
                                  updateElement(selectedElement.id, {
                                    dataSource: { ...currentDS, fieldName: e.target.value }
                                  });
                                }}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800"
                              >
                                {selectedElement.dataSource?.tableId === "files" ? (
                                  <>
                                    <option value="url">url</option>
                                    <option value="name">name</option>
                                  </>
                                ) : (
                                  userTables
                                    .find((t) => t.id === selectedElement.dataSource?.tableId)
                                    ?.fields?.map((field: any) => (
                                      <option key={field.name} value={field.name}>
                                        {field.name}
                                      </option>
                                    )) || <option value="url">url</option>
                                )}
                              </select>
                              <p className="text-[10px] text-gray-500 mt-1">
                                حدد حقل قاعدة البيانات (مثل image أو file_url) الذي سيتم تخزين رابط الملف المرفوع بداخله.
                              </p>
                            </div>
                            <div className="text-xs text-green-600 bg-white/60 p-2 rounded border border-green-200">
                              عند رفع أي ملف، سيتم إنشاء سجل جديد داخل جدول{" "}
                              <b>
                                {selectedElement.dataSource?.tableId === "files"
                                  ? "ملفات النظام (files)"
                                  : userTables.find(
                                      (t) => t.id === selectedElement.dataSource?.tableId
                                    )?.name || selectedElement.dataSource?.tableId
                                }
                              </b>{" "}
                              وتخزين رابط الملف في العمود المختار في قاعدة البيانات تلقائيًا!
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Workflows Edit */}
                  <ActionEditor
                    element={selectedElement}
                    updateElement={updateElement}
                    userPages={userPages}
                    sitePages={sitePages}
                    userTables={userTables}
                  />

                  {/* Advanced UI: Custom JS and CSS */}
                  <div className="space-y-4 mt-4 border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-900">
                      Advanced
                    </h3>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Custom CSS Class
                      </label>
                      <input
                        type="text"
                        value={selectedElement.customCss || ""}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            customCss: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                        placeholder="bg-red-500 hover:scale-105"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Custom ID
                      </label>
                      <input
                        type="text"
                        value={selectedElement.customId || ""}
                        onChange={(e) =>
                          updateElement(selectedElement.id, {
                            customId: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                        placeholder="my-special-element"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-4">
                    <button
                      onClick={() => removeElement(selectedElement.id)}
                      className="w-full py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md text-sm font-medium transition"
                    >
                      Delete Element
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">
                  Select an element on the canvas to edit its properties.
                </div>
              )}
            </aside>
          </div>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden h-14 bg-white border-t flex items-center justify-around shrink-0">
            <button
              onClick={() => setMobileView("elements")}
              className={`flex flex-col items-center ${mobileView === "elements" ? "text-blue-600" : "text-gray-500"}`}
            >
              <Plus className="w-5 h-5" />
              <span className="text-[10px] mt-1">Add</span>
            </button>
            <button
              onClick={() => setMobileView("canvas")}
              className={`flex flex-col items-center ${mobileView === "canvas" ? "text-blue-600" : "text-gray-500"}`}
            >
              <Layout className="w-5 h-5" />
              <span className="text-[10px] mt-1">Canvas</span>
            </button>
            <button
              onClick={() => setMobileView("properties")}
              className={`flex flex-col items-center ${mobileView === "properties" ? "text-blue-600" : "text-gray-500"}`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] mt-1">Edit</span>
            </button>
          </div>
        </>
      )}

      {topTab === "settings" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50">
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-2 text-gray-400" /> Site Settings
              & SEO
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Title{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    (Used for Browser Tab & SEO)
                  </span>
                </label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                  placeholder="e.g. My Awesome Site"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Domain
                  <span className="text-xs text-gray-500 font-normal ml-2">
                    (Vercel or custom setup required)
                  </span>
                </label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value.toLowerCase().replace(/https?:\/\//,'').trim())}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 outline-none focus:border-blue-500 sm:text-sm"
                    placeholder="example.com"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  You can set a custom domain here to link it with your project. If you deploy this project to Vercel, this domain will be linked automatically using the Vercel Domains API via Edge Middleware.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    (e.g., your-site-name)
                  </span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-md text-gray-500 text-sm whitespace-nowrap">
                    joe-web-builder.vercel.app/
                  </span>
                  <input
                    type="text"
                    value={pageSlug}
                    onChange={(e) =>
                      setPageSlug(
                        e.target.value.toLowerCase().replace(/\s+/g, "-"),
                      )
                    }
                    className="w-full px-4 py-2 border rounded-r-md outline-none focus:border-blue-500"
                    placeholder="my-site"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Page Description{" "}
                  <span className="text-xs text-gray-500 font-normal">
                    (Used for Search Engine Snippets)
                  </span>
                </label>
                <textarea
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md outline-none focus:border-blue-500"
                  placeholder="A brief description of this page..."
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {topTab === "database" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 flex flex-col items-center">
          <div className="max-w-xl w-full bg-white p-6 rounded-xl shadow-sm border mt-4">
            <div className="flex items-center space-x-4 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <TableIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">Database & Schema Sync</h2>
                <p className="text-xs text-gray-500">View schema mapping status and test live connection properties.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-lg">●</span>
                <div>
                  <h3 className="font-semibold text-emerald-800 text-sm">Supabase Connection Active</h3>
                  <p className="text-xs text-emerald-600 mt-0.5">Your page blocks, dynamic checklists, and forms are fully linked to the live cloud database.</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                <h3 className="text-2xs font-bold text-gray-500 uppercase tracking-wider">Dynamic Mapped Objects</h3>
                <ul className="text-xs space-y-2 text-gray-700">
                  <li className="flex justify-between items-center p-2.5 bg-white rounded border">
                    <span className="font-semibold font-mono">public.files</span>
                    <span className="text-3xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">Auto-Healed Failsafe</span>
                  </li>
                  <li className="flex justify-between items-center p-2.5 bg-white rounded border">
                    <span className="font-semibold font-mono">public.pages</span>
                    <span className="text-3xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full uppercase">Dynamic Content</span>
                  </li>
                  <li className="flex justify-between items-center p-2.5 bg-white rounded border">
                    <span className="font-semibold font-mono">public.records</span>
                    <span className="text-3xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full uppercase">Form Entries</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
                <h4 className="font-semibold text-amber-800 text-xs">Altered Table Columns Manually?</h4>
                <p className="text-3xs text-amber-700 mt-1 leading-relaxed">
                  PostgREST caches the schema cache internally. If you modified table schemas (like the missing <code>name</code> column in the <code>files</code> table), click below to validate if the tables respond correctly to your client instance.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const { error } = await supabase.from('files').select('id').limit(1);
                        if (error) throw error;
                        alert("Database connection synced! Active response verified successfully.");
                      } catch (err: any) {
                        alert("Sync validation error: " + err.message);
                      }
                    }}
                    className="px-3 py-1.5 bg-amber-600 text-white hover:bg-amber-700 rounded text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    Sync & Test Connection
                  </button>
                  <button
                    onClick={() => router.push("/dashboard")}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded text-xs font-medium transition cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {topTab === "users" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white flex flex-col items-center justify-center">
          <UserPlus className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            User Management
          </h2>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            View and manage users who signed up through your site&apos;s Auth
            forms.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Manage Users
          </button>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-green-600 flex items-center">
                <Check className="w-5 h-5 mr-2" /> Page Published!
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Your page is now live and accessible to the public at the
                following URL:
              </p>
              <div className="flex items-center space-x-2 mb-6">
                <input
                  type="text"
                  readOnly
                  value={getPublicUrl()}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                  title="Copy Link"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition"
                >
                  Close
                </button>
                <a
                  href={getPublicUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Visit Page
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Code Modal */}
      <ExportCodeModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        elements={useBuilderStore.getState().elements}
        variables={variables}
        slug={pageSlug}
      />
    </div>
  );
}

const BuilderElement = memo(function BuilderElement({
  element,
  canvasRef,
  setMobileView,
}: {
  element: PageElement;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  setMobileView: (view: "elements" | "canvas" | "properties") => void;
}) {
  const selectElement = useBuilderStore((state) => state.selectElement);
  const isSelected = useBuilderStore(
    (state) => state.selectedElementId === element.id,
  );
  const updateElement = useBuilderStore((state) => state.updateElement);

  return (
    <motion.div
      drag
      dragMomentum={false}
      dragConstraints={canvasRef}
      onDragEnd={(e, info) => {
        updateElement(element.id, {
          position: {
            x: (element.position?.x || 0) + info.offset.x,
            y: (element.position?.y || 0) + info.offset.y,
          },
        });
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectElement(element.id);
        setMobileView("properties");
      }}
      style={{
        position: "absolute",
        left: element.position?.x || 0,
        top: element.position?.y || 0,
        x: 0,
        y: 0,
      }}
      className={`cursor-move ${isSelected ? "outline-2 outline-blue-500 rounded" : ""}`}
    >
      <Renderer elements={[element]} isBuilderMode={true} />
    </motion.div>
  );
});
