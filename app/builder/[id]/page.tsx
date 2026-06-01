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
  FileText,
  Trash2,
  Database,
  Edit,
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
      { type: "avatar_list", icon: User, label: "Avatar List" },
      { type: "horizontal_card_list", icon: LayoutGrid, label: "Horizontal Card List" },
      { type: "horizontal_chip_list", icon: Tag, label: "Horizontal Chip List" },
      { type: "social_media_list", icon: MessageSquare, label: "Social Feed List" },
      { type: "kanban_board", icon: Layout, label: "Kanban Board" },
      { type: "calendar_list", icon: Clock, label: "Calendar List" },
      { type: "timeline_list", icon: ListOrdered, label: "Timeline List" },
      { type: "carousel_list", icon: ImageIcon, label: "Carousel List" },
      { type: "chat_list", icon: Send, label: "Chat List" },
      { type: "tree_list", icon: List, label: "Tree/Folder List" },
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
      { type: "switch", icon: ToggleRight, label: "Switch" },
      { type: "checkbox", icon: CheckSquare, label: "Checkbox" },
      { type: "checklist", icon: CheckSquare, label: "Checklist" },
      { type: "auth_form", icon: UserPlus, label: "Sign Up / Login" },
      { type: "toggle", icon: ToggleRight, label: "Toggle" },
      { type: "signature", icon: PenTool, label: "Signature" },
    ] as { type: ElementType; icon: any; label: string }[],
  },
  {
    name: "Structure & Misc",
    items: [
      { type: "container", icon: Layout, label: "Container" },
      { type: "video", icon: Video, label: "Video" },
      { type: "badge", icon: Tag, label: "Badge" },
      { type: "accordion", icon: ChevronDown, label: "Accordion" },
      { type: "progress", icon: BatteryMedium, label: "Progress" },
      { type: "table", icon: TableIcon, label: "Table" },
      { type: "rich_text", icon: FileText, label: "Rich Text" },
      { type: "html", icon: Code, label: "HTML" },
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
      { type: "stat", icon: BarChart, label: "Stat" },
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
  const editingListId = useBuilderStore((s) => s.editingListId);
  const elementIds = useBuilderStore(useShallow((s) => s.elements.filter(e => e.parentId === (editingListId || null) || e.parentId === editingListId || (!editingListId && !e.parentId)).map(e => e.id)));
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
  const editingListId = useBuilderStore((s) => s.editingListId);
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

  // Embedded Project Database State
  const [dbEditSelectedTable, setDbEditSelectedTable] = useState<any | null>(null);
  const [dbEditViewMode, setDbEditViewMode] = useState<'schema' | 'data'>('data');
  const [dbEditRecords, setDbEditRecords] = useState<any[]>([]);
  const [dbEditLoadingRecords, setDbEditLoadingRecords] = useState(false);
  const [isDbEditAddingRecord, setIsDbEditAddingRecord] = useState(false);
  const [dbEditEditingRecord, setDbEditEditingRecord] = useState<any | null>(null);
  const [dbEditNewRecordData, setDbEditNewRecordData] = useState<any>({});
  const [isDbEditCreatingTable, setIsDbEditCreatingTable] = useState(false);
  const [dbEditNewTableName, setDbEditNewTableName] = useState('');
  const [dbEditNewFieldName, setDbEditNewFieldName] = useState('');
  const [dbEditNewFieldType, setDbEditNewFieldType] = useState<'text' | 'number' | 'date' | 'boolean' | 'relationship'>('text');
  const [dbEditRelationRelatedTableId, setDbEditRelationRelatedTableId] = useState<string>('');
  const [dbEditRelationRelationType, setDbEditRelationRelationType] = useState<string>('one_to_many');
  const [dbEditRelationRelatedFieldName, setDbEditRelationRelatedFieldName] = useState<string>('');
  const [extraProjectTableIds, setExtraProjectTableIds] = useState<string[]>([]);
  const [allTablesRecords, setAllTablesRecords] = useState<Record<string, any[]>>({});
  const [dataPickerTargetField, setDataPickerTargetField] = useState<string | null>(null);
  const [dataPickerIsOpen, setDataPickerIsOpen] = useState(false);
  const [dataPickerPathStack, setDataPickerPathStack] = useState<string[]>([]);

  // Embedded User Manager State
  const [builderSiteUsers, setBuilderSiteUsers] = useState<any[]>([]);
  const [builderSiteUsersLoading, setBuilderSiteUsersLoading] = useState(false);
  const [isBuilderAddingUser, setIsBuilderAddingUser] = useState(false);
  const [builderNewUserEmail, setBuilderNewUserEmail] = useState('');
  const [builderNewUserName, setBuilderNewUserName] = useState('');
  const [builderNewUserPassword, setBuilderNewUserPassword] = useState('');
  const [builderNewUserRole, setBuilderNewUserRole] = useState<'user' | 'admin'>('user');

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

  // Project-Bound Database helper queries & mutations
  const getProjectTableIds = () => {
    const ids = new Set<string>();
    const state = useBuilderStore.getState();
    const pagesList = state.sitePages || [];
    pagesList.forEach((page: any) => {
      const elements = page.elements || [];
      elements.forEach((el: any) => {
        if (el.dataSource?.tableId) {
          ids.add(el.dataSource.tableId);
        }
        if (Array.isArray(el.dataSources)) {
          el.dataSources.forEach((ds: any) => {
            if (ds?.tableId) ids.add(ds.tableId);
          });
        }
      });
    });
    return Array.from(ids);
  };

  const getProjectTables = () => {
    const boundIds = getProjectTableIds();
    return userTables.filter(t => 
      t.id !== 'site_users' && 
      (boundIds.includes(t.id) || 
       t.name === "جهات اتصال واتساب" || 
       t.name === "رسائل واتساب Web" || 
       extraProjectTableIds.includes(t.id))
    );
  };

  // Automatically select the first project table once tables are loaded
  useEffect(() => {
    if (topTab === "database" && !dbEditSelectedTable) {
      const prjTables = getProjectTables();
      if (prjTables.length > 0) {
        setDbEditSelectedTable(prjTables[0]);
      }
    }
  }, [topTab, userTables]);

  // Fetch table records when selectedTable or viewMode changes
  useEffect(() => {
    const fetchTableRecords = async () => {
      if (topTab === "database" && dbEditSelectedTable && dbEditViewMode === 'data') {
        setDbEditLoadingRecords(true);
        try {
          const { data, error } = await supabase
            .from('records')
            .select('*')
            .eq('table_id', dbEditSelectedTable.id);
            
          if (error) throw error;
          
          const parsedRecords = (data || []).map(record => ({
            id: record.id,
            created_at: record.created_at,
            ...(typeof record.data === 'string' ? JSON.parse(record.data) : record.data)
          }));
          
          setDbEditRecords(parsedRecords);
        } catch (error) {
          console.error("Error fetching project records", error);
        } finally {
          setDbEditLoadingRecords(false);
        }
      }
    };
    
    fetchTableRecords();
  }, [topTab, dbEditSelectedTable, dbEditViewMode]);

  // Fetch all tables' records for relation dropdown selectors
  useEffect(() => {
    const fetchAllTablesRecords = async () => {
      if (topTab === "database") {
        try {
          const { data, error } = await supabase
            .from('records')
            .select('*');
          if (error) throw error;
          
          const recordMap: Record<string, any[]> = {};
          (data || []).forEach(record => {
            const tId = record.table_id;
            const parsed = typeof record.data === 'string' ? JSON.parse(record.data) : record.data;
            if (!recordMap[tId]) recordMap[tId] = [];
            recordMap[tId].push({
              id: record.id,
              created_at: record.created_at,
              ...(parsed || {})
            });
          });
          setAllTablesRecords(recordMap);
        } catch (e) {
          console.error("Error prefetching all tables records:", e);
        }
      }
    };
    fetchAllTablesRecords();
  }, [topTab, userTables]);

  // Fetch registered builder site users when users tab is active
  useEffect(() => {
    const fetchSiteUsers = async () => {
      if (topTab === "users" && user) {
        setBuilderSiteUsersLoading(true);
        try {
          const { data, error } = await supabase
            .from('site_users')
            .select('*')
            .eq('owner_id', user.id);
            
          if (error) throw error;
          setBuilderSiteUsers(data || []);
        } catch (error) {
          console.error("Error fetching site users within builder", error);
        } finally {
          setBuilderSiteUsersLoading(false);
        }
      }
    };
    fetchSiteUsers();
  }, [topTab, user]);

  // Project database handlers
  const handleCreateProjectTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dbEditNewTableName.trim()) return;
    setIsDbEditCreatingTable(true);
    
    const defaultFields = [
      { id: Date.now().toString(), name: 'Name', type: 'text' }
    ];

    try {
      const { data, error } = await supabase
        .from('tables')
        .insert({
          user_id: user.id,
          name: dbEditNewTableName,
          fields: JSON.stringify(defaultFields),
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      const newTable = { 
        id: data.id, 
        name: dbEditNewTableName, 
        fields: defaultFields 
      };
      
      setUserTables(prev => [...prev.filter(t => t.id !== newTable.id), newTable]);
      setExtraProjectTableIds(prev => [...prev, data.id]);
      setDbEditSelectedTable(newTable);
      setDbEditNewTableName('');
      setIsDbEditCreatingTable(false);
      alert("🎉 تم إنشاء الجدول بنجاح في قاعدة البيانات ومزامنته مع المشروع الحالي!");
    } catch (error: any) {
      console.error("Error creating project table:", error);
      alert("فشل إنشاء الجدول: " + error.message);
    } finally {
      setIsDbEditCreatingTable(false);
    }
  };

  const handleDeleteProjectTable = async (tableId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الجدول نهائياً؟ ستفقد جميع الحقول والبيانات المسجلة.')) return;
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId);
        
      if (error) throw error;
      
      setUserTables(prev => prev.filter(t => t.id !== tableId));
      setExtraProjectTableIds(prev => prev.filter(id => id !== tableId));
      setDbEditSelectedTable(null);
      alert("تم حذف الجدول بالكامل بنجاح!");
    } catch (error: any) {
      console.error("Error deleting table", error);
      alert("فشل حذف الجدول: " + error.message);
    }
  };

  const handleUpdateProjectTableFields = async (updatedFields: any[]) => {
    if (!dbEditSelectedTable) return;
    
    // Update state first optimistically
    const updatedTable = { ...dbEditSelectedTable, fields: updatedFields };
    setDbEditSelectedTable(updatedTable);
    setUserTables(prev => prev.map(t => t.id === dbEditSelectedTable.id ? updatedTable : t));

    try {
      const { error } = await supabase
        .from('tables')
        .update({
          fields: JSON.stringify(updatedFields),
        })
        .eq('id', dbEditSelectedTable.id);
        
      if (error) throw error;
    } catch (error) {
      console.error("Error updating table fields", error);
      alert("حدث خطأ أثناء حفظ التحديث في قاعدة البيانات.");
    }
  };

  const handleAddProjectTableField = () => {
    if (!dbEditSelectedTable || !dbEditNewFieldName.trim()) return;
    const isNameExists = dbEditSelectedTable.fields.some((f: any) => f.name.toLowerCase() === dbEditNewFieldName.trim().toLowerCase());
    if (isNameExists) {
      alert("هذا الحقل موجود بالفعل!");
      return;
    }
    const newField = { 
      id: Date.now().toString(), 
      name: dbEditNewFieldName.trim(), 
      type: dbEditNewFieldType,
      ...(dbEditNewFieldType === 'relationship' && {
        relatedTableId: dbEditRelationRelatedTableId,
        relationType: dbEditRelationRelationType,
        relatedFieldName: dbEditRelationRelatedFieldName
      })
    };
    const updatedFields = [...dbEditSelectedTable.fields, newField];
    handleUpdateProjectTableFields(updatedFields);
    setDbEditNewFieldName('');
    setDbEditRelationRelatedTableId('');
    setDbEditRelationRelatedFieldName('');
  };

  const handleRemoveProjectTableField = (fieldId: string) => {
    if (!dbEditSelectedTable) return;
    if (!confirm("هل أنت متأكد من حذف هذا الحقل من الجدول؟")) return;
    const updatedFields = dbEditSelectedTable.fields.filter((f: any) => f.id !== fieldId);
    handleUpdateProjectTableFields(updatedFields);
  };

  const handleSelectToken = (token: string) => {
    if (!selectedElement || !dataPickerTargetField) return;
    
    const isNested = dataPickerTargetField.includes(".");
    if (isNested) {
      const parts = dataPickerTargetField.split(".");
      const main = parts[0];
      const sub = parts[1];
      const oldVal = (selectedElement as any)[main]?.[sub] || "";
      const newVal = oldVal + ` {{ ${token} }}`;
      updateElement(selectedElement.id, {
        [main]: {
          ...((selectedElement as any)[main] || {}),
          [sub]: newVal
        }
      });
    } else {
      const oldVal = (selectedElement as any)[dataPickerTargetField] || "";
      const newVal = typeof oldVal === "string" ? (oldVal + ` {{ ${token} }}`) : `{{ ${token} }}`;
      updateElement(selectedElement.id, { [dataPickerTargetField]: newVal });
    }
    
    setDataPickerIsOpen(false);
    setDataPickerTargetField(null);
    setDataPickerPathStack([]);
  };

  const handleAddProjectRecord = async () => {
    if (!dbEditSelectedTable || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('records')
        .insert({
          table_id: dbEditSelectedTable.id,
          user_id: user.id,
          data: JSON.stringify(dbEditNewRecordData),
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      const newRecord = {
          id: data.id,
          created_at: data.created_at,
          ...dbEditNewRecordData
      };
      
      setDbEditRecords(prev => [...prev, newRecord]);
      setIsDbEditAddingRecord(false);
      setDbEditNewRecordData({});
      alert("تمت إضافة السجل الجديد بنجاح!");
    } catch (error: any) {
       console.error("Error adding project record", error);
       alert("فشل إضافة السجل للأسباب التالية: " + error.message);
    }
  };

  const handleDeleteProjectRecord = async (recordId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا السجل نهائياً؟')) return;
    try {
      const { error } = await supabase
        .from('records')
        .delete()
        .eq('id', recordId);
        
      if (error) throw error;
      setDbEditRecords(prev => prev.filter(r => r.id !== recordId));
    } catch (error: any) {
      console.error("Error deleting project record", error);
      alert("فشل حذف السجل: " + error.message);
    }
  };

  const handleUpdateProjectRecord = async () => {
    if (!dbEditSelectedTable || !dbEditEditingRecord) return;
    
    const { id: recordId, created_at, ...recordPayload } = dbEditEditingRecord;
    
    try {
      const { error } = await supabase
        .from('records')
        .update({
          data: JSON.stringify(recordPayload)
        })
        .eq('id', recordId);
        
      if (error) throw error;
      
      setDbEditRecords(prev => prev.map(r => r.id === recordId ? dbEditEditingRecord : r));
      setDbEditEditingRecord(null);
      alert("✅ تم تحديث السجل بنجاح في قاعدة البيانات!");
    } catch (error: any) {
      console.error("Error updating project record", error);
      alert("فشل تحديث السجل: " + error.message);
    }
  };

  // Site Users Handlers (Registered users by site dynamic signup forms)
  const handleBuilderCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !builderNewUserEmail.trim() || !builderNewUserPassword.trim()) {
      alert("يرجى ملء الحقول المطلوبة (البريد الإلكتروني وكلمة المرور)");
      return;
    }
    try {
      const { data, error } = await supabase
        .from('site_users')
        .insert({
          owner_id: user.id,
          email: builderNewUserEmail.trim(),
          password: builderNewUserPassword,
          name: builderNewUserName.trim() || null,
          role: builderNewUserRole,
        })
        .select('*')
        .single();
        
      if (error) throw error;
      
      setBuilderSiteUsers(prev => [...prev, data]);
      setIsBuilderAddingUser(false);
      setBuilderNewUserEmail('');
      setBuilderNewUserName('');
      setBuilderNewUserPassword('');
      setBuilderNewUserRole('user');
      alert("🎉 تم إنشاء حساب المستخدم بنجاح ومزامنته في قاعدة بيانات المشروع!");
    } catch (error: any) {
      console.error("Error creating builder site user:", error);
      alert("فشل إنشاء الحساب: " + error.message);
    }
  };

  const handleBuilderDeleteUser = async (uId: string) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذا المستخدم من قاعدة البيانات نهائياً؟")) return;
    try {
      const { error } = await supabase
        .from('site_users')
        .delete()
        .eq('id', uId);
        
      if (error) throw error;
      setBuilderSiteUsers(prev => prev.filter(u => u.id !== uId));
      alert("تم حذف حساب المستخدم بنجاح!");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      alert("فشل حذف حساب المستخدم: " + error.message);
    }
  };

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
              className={`${mobileView === "canvas" ? "flex" : "hidden"} md:flex flex-col flex-1 relative overflow-auto bg-white`}
              onClick={(e) => {
                if (e.target === e.currentTarget || (e.target as HTMLElement).id === "canvas-map") {
                   selectElement(null);
                }
              }}
            >
              {editingListId && (
                 <div className="bg-indigo-50 border-b border-indigo-100 p-2 text-sm flex items-center gap-2 font-medium">
                   <button onClick={() => useBuilderStore.getState().setEditingListId(null)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition px-2 py-1 bg-white rounded shadow-sm">
                     ← Return to Page
                   </button>
                   <span className="text-indigo-800">Editing List Item Template</span>
                 </div>
              )}
              <div
                id="canvas-map"
                ref={canvasRef}
                onClick={() => selectElement(null)}
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
                  {/* List Template Edit Button */}
                  {[ "list", "simple_list", "card_list", "image_list",
                    "masonry_list", "horizontal_list", "custom_list", "table",
                    "avatar_list", "horizontal_card_list", "horizontal_chip_list", "social_media_list",
                    "kanban_board", "calendar_list", "timeline_list", "carousel_list",
                    "chat_list", "tree_list"].includes(selectedElement.type) && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex flex-col gap-2">
                       <span className="text-xs font-semibold text-indigo-900">List Template</span>
                       <p className="text-xs text-indigo-700">Design the internal layout of list items using drag & drop.</p>
                       <button
                         onClick={() => {
                           useBuilderStore.getState().setEditingListId(selectedElement.id);
                           useBuilderStore.getState().selectElement(null);
                         }}
                         className="bg-indigo-600 text-white text-xs font-medium px-3 py-2 rounded shadow-sm hover:bg-indigo-700 transition"
                       >
                         Edit List Item Template
                       </button>
                    </div>
                  )}

                  {/* Content Edit */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-medium text-gray-700">
                        Content (المحتوى)
                      </label>
                      <button
                        onClick={() => {
                          setDataPickerTargetField("content");
                          setDataPickerIsOpen(true);
                          setDataPickerPathStack([]);
                        }}
                        className="text-3xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-extrabold px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition border border-indigo-200"
                        title="ربط محتوى هذا العنصر ببيانات قاعدة البيانات مباشرة كـ Adalo (Data Picker)"
                      >
                        ⚡ ربط بيانات ديناميكية
                      </button>
                    </div>
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
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 border-b pb-2 flex justify-between items-center">
                        <span>الظهور المشروط (Conditional Visibility)</span>
                        <span className="text-3xs font-mono text-gray-400">Adalo Filters</span>
                      </h3>
                      
                      {!(selectedElement as any).visibilityConfig ? (
                        <button
                          type="button"
                          onClick={() => {
                            updateElement(selectedElement.id, {
                              visibilityConfig: { field: "", operator: "eq", value: "" }
                            } as any);
                          }}
                          className="w-full text-center py-2 border border-dashed border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:text-indigo-600 hover:border-indigo-400 transition cursor-pointer"
                        >
                          + إضافة شروط ظهور لهذا المكون
                        </button>
                      ) : (
                        <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 space-y-3 text-right">
                          <label className="block text-3xs font-extrabold text-indigo-900 uppercase">قيمة الحقل المراد مقارنته (Field to test)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={(selectedElement as any).visibilityConfig?.field || ""}
                              onChange={(e) => {
                                updateElement(selectedElement.id, {
                                  visibilityConfig: {
                                    ...(selectedElement as any).visibilityConfig,
                                    field: e.target.value
                                  }
                                } as any);
                              }}
                              className="flex-1 px-2.5 py-1.5 border rounded bg-white text-xs text-right outline-none"
                              placeholder="مثال: {{ Logged In User > Name }}"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setDataPickerTargetField("visibilityConfig.field");
                                setDataPickerIsOpen(true);
                                setDataPickerPathStack([]);
                              }}
                              className="px-2 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 cursor-pointer"
                              title="اختر حقل البيانات"
                            >
                              🪄
                            </button>
                          </div>

                          <label className="block text-3xs font-extrabold text-indigo-900 uppercase">الشرط (Operator)</label>
                          <select
                            value={(selectedElement as any).visibilityConfig?.operator || "eq"}
                            onChange={(e) => {
                              updateElement(selectedElement.id, {
                                visibilityConfig: {
                                  ...(selectedElement as any).visibilityConfig,
                                  operator: e.target.value
                                }
                              } as any);
                            }}
                            className="w-full px-2.5 py-1.5 border rounded bg-white text-xs text-right outline-none"
                          >
                            <option value="eq">يساوي (Equals)</option>
                            <option value="neq">لا يساوي (Not Equals)</option>
                            <option value="contains">يحتوي على (Contains)</option>
                            <option value="gt">أكبر بـ (Greater Than)</option>
                            <option value="lt">أصغر بـ (Less Than)</option>
                          </select>

                          <label className="block text-3xs font-extrabold text-indigo-900 uppercase">القيمة المقارن بها (Value to test against)</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={(selectedElement as any).visibilityConfig?.value || ""}
                              onChange={(e) => {
                                updateElement(selectedElement.id, {
                                  visibilityConfig: {
                                    ...(selectedElement as any).visibilityConfig,
                                    value: e.target.value
                                  }
                                } as any);
                              }}
                              className="flex-1 px-2.5 py-1.5 border rounded bg-white text-xs text-right outline-none"
                              placeholder="القيمة المقارنة..."
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setDataPickerTargetField("visibilityConfig.value");
                                setDataPickerIsOpen(true);
                                setDataPickerPathStack([]);
                              }}
                              className="px-2 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 cursor-pointer"
                              title="اختر حقل البيانات"
                            >
                              🪄
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              updateElement(selectedElement.id, { visibilityConfig: undefined } as any);
                            }}
                            className="w-full text-center py-1 mt-1 bg-red-50 hover:bg-red-100 text-red-650 text-3xs font-bold rounded transition cursor-pointer"
                          >
                            ✕ حذف الشرط والظهور للكل
                          </button>
                        </div>
                      )}
                    </div>

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
                    selectedElement.type === "avatar_list" ||
                    selectedElement.type === "horizontal_card_list" ||
                    selectedElement.type === "horizontal_chip_list" ||
                    selectedElement.type === "social_media_list" ||
                    selectedElement.type === "kanban_board" ||
                    selectedElement.type === "calendar_list" ||
                    selectedElement.type === "timeline_list" ||
                    selectedElement.type === "carousel_list" ||
                    selectedElement.type === "chat_list" ||
                    selectedElement.type === "tree_list" ||
                    selectedElement.type === "table" ||
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

                          {getProjectTables().map((t) => (
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
                          selectedElement.type === "custom_list" ||
                          selectedElement.type === "avatar_list" ||
                          selectedElement.type === "horizontal_card_list" ||
                          selectedElement.type === "horizontal_chip_list" ||
                          selectedElement.type === "social_media_list" ||
                          selectedElement.type === "kanban_board" ||
                          selectedElement.type === "calendar_list" ||
                          selectedElement.type === "timeline_list" ||
                          selectedElement.type === "carousel_list" ||
                          selectedElement.type === "chat_list" ||
                          selectedElement.type === "tree_list" ||
                          selectedElement.type === "table") && (
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
        <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col md:flex-row h-full">
          {/* Sidebar Collections Panel */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r bg-white flex flex-col shrink-0">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-gray-800 text-sm">جداول المشروع (Project Tables)</h3>
              </div>
              <span className="text-3xs bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full uppercase">
                {getProjectTables().length} متصل
              </span>
            </div>

            <div className="p-3 border-b bg-gray-50/50">
              {isDbEditCreatingTable ? (
                <form onSubmit={handleCreateProjectTable} className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="اسم الجدول الجديد (بالعربية أو الإنجليزية)"
                    value={dbEditNewTableName}
                    onChange={(e) => setDbEditNewTableName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border rounded-md outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1">
                    <button
                      type="submit"
                      className="flex-1 py-1 px-2.5 text-3xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition cursor-pointer text-center"
                    >
                      إنشاء الجدول
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDbEditCreatingTable(false)}
                      className="py-1 px-2 text-3xs border text-gray-600 rounded-md hover:bg-gray-150 transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsDbEditCreatingTable(true)}
                  className="w-full py-2 px-3 border border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/30 text-indigo-600 rounded-lg flex items-center justify-center text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> إنشاء جدول جديد للمشروع
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {getProjectTables().length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-xs">
                  لا توجد جداول بيانات معينة لهذا المشروع حتى الآن. قم بإنشاء جدول جديد للاستخدام!
                </div>
              ) : (
                getProjectTables().map((table) => (
                  <div
                    key={table.id}
                    className={`group w-full rounded-lg transition-all p-2 flex items-center justify-between cursor-pointer ${
                      dbEditSelectedTable?.id === table.id
                        ? "bg-indigo-50 text-indigo-900 border border-indigo-200"
                        : "text-gray-700 hover:bg-gray-100/70 border border-transparent"
                    }`}
                    onClick={() => {
                      setDbEditSelectedTable(table);
                      setDbEditViewMode('data');
                    }}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <TableIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span className="text-xs font-semibold truncate text-left">{table.name}</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProjectTable(table.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="حذف الجدول بالكامل"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t bg-gray-50 text-3xs text-gray-500 space-y-1 leading-relaxed">
              <p>💡 <b>تنبيه فائق الأهمية:</b></p>
              <p>تظهر هنا الجداول المرتبطة بعناصر التصميم الحالي للمشروع فقط لتوفير بيئة عمل سريعة ومنظمة! يمكنك رفع الصور والمستندات بمرونة في الحقول وسيتم حفظ الروابط ديناميكياً.</p>
            </div>
          </div>

          {/* Main Collection Data Editor */}
          <div className="flex-1 bg-white flex flex-col overflow-hidden">
            {dbEditSelectedTable ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Collection Sub-header */}
                <div className="px-6 py-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white shrink-0 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                      <TableIcon className="w-5 h-5 text-indigo-600" />
                      {dbEditSelectedTable.name}
                    </h2>
                    <p className="text-2xs text-gray-400 mt-0.5 font-mono">ID: {dbEditSelectedTable.id}</p>
                  </div>

                  <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg self-stretch sm:self-auto shrink-0">
                    <button
                      onClick={() => setDbEditViewMode('data')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                        dbEditViewMode === 'data'
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      البيانات المسجلة (Data)
                    </button>
                    <button
                      onClick={() => setDbEditViewMode('schema')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                        dbEditViewMode === 'schema'
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      هيكلية الجدول (Schema)
                    </button>
                  </div>
                </div>

                {/* Sub-view switcher */}
                {dbEditViewMode === 'data' ? (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Data Toolbar */}
                    <div className="px-6 py-3 border-b bg-gray-50 flex items-center justify-between shrink-0">
                      <div className="text-xs text-gray-500 font-medium">
                        إجمالي السجلات: <span className="font-bold text-gray-800 font-mono">{dbEditRecords.length}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // Reset and open adding record modal
                            const emptyData = dbEditSelectedTable.fields.reduce((acc: any, f: any) => {
                              acc[f.name] = '';
                              return acc;
                            }, {} as any);
                            setDbEditNewRecordData(emptyData);
                            setIsDbEditAddingRecord(true);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-md shadow-2xs flex items-center transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> إضافة سجل جديد
                        </button>
                      </div>
                    </div>

                    {/* Data Grid list */}
                    <div className="flex-1 overflow-auto">
                      {dbEditLoadingRecords ? (
                        <div className="p-12 text-center text-gray-500 text-xs">جاري تحميل سجلات البيانات...</div>
                      ) : dbEditRecords.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center justify-center">
                          <TableIcon className="w-12 h-12 text-gray-200 mb-2" />
                          <p className="text-gray-500 text-xs">لا يوجد بيانات مسجلة في هذا الجدول حالياً.</p>
                          <p className="text-3xs text-gray-400 mt-1 max-w-xs text-center">أدخل بيانات أو اربط النماذج من واجهة التصنيف لتبدأ باستلام البيانات وحفظها تلقائياً.</p>
                        </div>
                      ) : (
                        <div className="min-w-full inline-block align-middle">
                          <div className="overflow-hidden border-b border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200 text-right" dir="rtl">
                              <thead className="bg-gray-50/70">
                                <tr>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right"># ID</th>
                                  {dbEditSelectedTable.fields.map((field: any, index: number) => (
                                    <th key={field.id || field.name || index} className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                                      {field.name}
                                    </th>
                                  ))}
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">تاريخ الإضافة</th>
                                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">الإجراءات</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {dbEditRecords.map((record) => (
                                  <tr key={record.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-4 py-3 text-2xs font-mono text-gray-400 select-all truncate max-w-[80px]" title={record.id}>
                                      {String(record.id).slice(0, 8)}...
                                    </td>
                                    {dbEditSelectedTable.fields.map((field: any, index: number) => {
                                      const val = record[field.name];
                                      const isUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
                                      const isImage = isUrl && (val.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)/i) || val.includes('supabase') || val.includes('cloudinary'));

                                      return (
                                        <td key={field.id || field.name || index} className="px-4 py-3 text-xs text-gray-700 font-medium font-semibold">
                                          {isImage ? (
                                            <div className="flex items-center space-x-2 space-x-reverse">
                                              <img
                                                src={val}
                                                alt="File"
                                                className="w-10 h-10 object-cover rounded-md border shadow-2xs shrink-0 bg-gray-50"
                                                onError={(e) => {
                                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                }}
                                              />
                                              <a
                                                href={val}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-indigo-600 hover:text-indigo-800 text-3xs font-semibold truncate hover:underline max-w-[120px]"
                                              >
                                                معاينة الرابط
                                              </a>
                                            </div>
                                          ) : isUrl ? (
                                            <a
                                              href={val}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="text-indigo-600 hover:text-indigo-800 text-3xs font-semibold underline truncate max-w-[150px] block"
                                              title={val}
                                            >
                                              {val}
                                            </a>
                                          ) : (
                                            <span className="truncate max-w-[180px] block" title={String(val || '')}>
                                              {val !== undefined && val !== null ? String(val) : "-"}
                                            </span>
                                          )}
                                        </td>
                                      );
                                    })}
                                    <td className="px-4 py-3 text-2xs text-gray-400 font-mono">
                                      {record.created_at ? new Date(record.created_at).toLocaleString('ar-EG', { hour12: true }) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => setDbEditEditingRecord(record)}
                                          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                                          title="تعديل السجل"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProjectRecord(record.id)}
                                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                                          title="حذف البيانات كاملة"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Schema Config view */
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-gray-50 border rounded-xl p-5 space-y-4">
                      <h3 className="font-bold text-gray-800 text-xs flex items-center space-x-2 space-x-reverse">
                        <Plus className="w-4 h-4 text-indigo-600" />
                        <span>إضافة حقل جديد إلى هذا الجدول (Add Table Column)</span>
                      </h3>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="block text-3xs font-extrabold text-gray-500 uppercase">اسم الحقل (Field Name)</label>
                            <input
                              type="text"
                              placeholder="مثال: post_author أو liked_by"
                              value={dbEditNewFieldName}
                              onChange={(e) => setDbEditNewFieldName(e.target.value)}
                              className="w-full px-3 py-1.5 border rounded-md text-xs outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-3xs font-extrabold text-gray-500 uppercase font-mono">نوع الحقل (Field Type)</label>
                            <select
                              value={dbEditNewFieldType}
                              onChange={(e: any) => {
                                setDbEditNewFieldType(e.target.value);
                                if (e.target.value === 'relationship' && userTables.length > 0) {
                                  // Auto-select first available table (excluding current if self-relationship isn't default)
                                  const defaultTarget = userTables.find(t => t.id !== dbEditSelectedTable?.id) || userTables[0];
                                  if (defaultTarget) setDbEditRelationRelatedTableId(defaultTarget.id);
                                }
                              }}
                              className="w-full px-3 py-1.5 border rounded-md text-xs outline-none bg-white focus:border-indigo-500"
                            >
                              <option value="text">نصّي / رابط ملف (Text / File URL)</option>
                              <option value="number">رقمي (Number)</option>
                              <option value="date">تاريخ (Date)</option>
                              <option value="boolean">نعم أو لا (Boolean)</option>
                              <option value="relationship">🔗 علاقة (Relationship - ربط بالجداول) </option>
                            </select>
                          </div>

                          <div className="flex items-end">
                            {dbEditNewFieldType !== 'relationship' && (
                              <button
                                type="button"
                                onClick={handleAddProjectTableField}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-md shadow-2xs transition cursor-pointer"
                              >
                                إضافة العمود
                              </button>
                            )}
                          </div>
                        </div>

                        {dbEditNewFieldType === 'relationship' && (
                          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg space-y-4 animate-fade-in text-right">
                            <h4 className="text-xs font-bold text-indigo-950">إعدادات العلاقة المتقدمة (Adalo-style Relation Settings)</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="block text-3xs font-extrabold text-indigo-900 uppercase">الجدول المرتبط (Related Table)</label>
                                <select
                                  value={dbEditRelationRelatedTableId}
                                  onChange={(e) => setDbEditRelationRelatedTableId(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-indigo-200 rounded-md text-xs outline-none bg-white focus:border-indigo-500"
                                >
                                  <option value="">-- اختر جدول مستهدف --</option>
                                  {userTables.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.name} {t.id === dbEditSelectedTable?.id ? "(هذا الجدول - Self)" : ""}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-3xs font-extrabold text-indigo-900 uppercase">نوع العلاقة (Cardinality Type)</label>
                                <select
                                  value={dbEditRelationRelationType}
                                  onChange={(e) => setDbEditRelationRelationType(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-indigo-200 rounded-md text-xs outline-none bg-white focus:border-indigo-500"
                                >
                                  <option value="one_to_many">واحد إلى متعدد (1:N - One To Many)</option>
                                  <option value="many_to_many">متعدد إلى متعدد (N:M - Many To Many)</option>
                                  <option value="one_to_one">واحد إلى واحد (1:1 - One To One)</option>
                                  <option value="self_relationship">علاقة ذاتية مع نفسه (Self Relationship)</option>
                                </select>
                              </div>

                              <div className="space-y-1">
                                <label className="block text-3xs font-extrabold text-indigo-900 uppercase">اسم الحقل العكسي (Related Reverse Name)</label>
                                <input
                                  type="text"
                                  placeholder="اختياري (مثال: Author's Posts)"
                                  value={dbEditRelationRelatedFieldName}
                                  onChange={(e) => setDbEditRelationRelatedFieldName(e.target.value)}
                                  className="w-full px-3 py-1.5 border border-indigo-200 rounded-md text-xs outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={handleAddProjectTableField}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-6 rounded-md shadow-2xs transition cursor-pointer"
                              >
                                تأكيد العمود وحفظ العلاقة
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-850 text-xs">الأعمدة والحقول الحالية (Active Schema Columns)</h4>
                      <div className="border rounded-xl bg-white overflow-hidden divide-y">
                        {dbEditSelectedTable.fields.map((field: any) => (
                          <div key={field.id} className="p-4 flex items-center justify-between text-right hover:bg-gray-50 transition">
                            <div className="flex items-center space-x-4 space-x-reverse">
                              <span className="text-xs bg-gray-100 font-mono font-semibold px-2.5 py-1 rounded text-gray-700 uppercase">
                                {field.type}
                              </span>
                              <span className="font-semibold text-gray-800 text-xs">{field.name}</span>
                              {field.type === "relationship" && (
                                <span className="text-3xs text-indigo-700 bg-indigo-50 border border-indigo-100 font-medium px-2 py-0.5 rounded-full">
                                  مرتبط بـ {userTables.find(t => t.id === field.relatedTableId)?.name || "جدول مجهول"} ({
                                    field.relationType === "one_to_many" ? "One to Many" :
                                    field.relationType === "many_to_many" ? "Many to Many" :
                                    field.relationType === "one_to_one" ? "One to One" : "Self-Relation"
                                  })
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => handleRemoveProjectTableField(field.id)}
                              disabled={field.name.toLowerCase() === 'name'}
                              className={`p-1.5 rounded-md transition ${
                                field.name.toLowerCase() === 'name' 
                                  ? "text-gray-300 cursor-not-allowed" 
                                  : "text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              }`}
                              title={field.name.toLowerCase() === 'name' ? "الحقل الأساسي محمي ولا يُمكن حذفه" : "حذف العمود تماماً"}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                <Database className="w-16 h-16 text-indigo-300 mb-4 animate-pulse" />
                <h3 className="text-base font-bold text-gray-700">الرجاء تحديد جدول من على اليمين</h3>
                <p className="text-xs text-gray-500 max-w-sm mt-1">تتيح لك هذه المنصة إدارة البيانات مدعومة برفع حقيقي للملفات والصور وحفظ روابطها مباشرة، بالإضافة لحذف وتعديل الجداول وتفاصيل السجلات بمرونة.</p>
              </div>
            )}
          </div>

          {/* New Record Modal */}
          {isDbEditAddingRecord && dbEditSelectedTable && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-up">
                <div className="px-6 py-4 border-b bg-indigo-50 flex justify-between items-center text-right shrink-0">
                  <h3 className="text-sm font-extrabold text-indigo-900">
                    📝 إضافة سجل جديد لجدول: {dbEditSelectedTable.name}
                  </h3>
                  <button
                    onClick={() => setIsDbEditAddingRecord(false)}
                    className="text-gray-400 hover:text-gray-700 p-1 text-md font-bold"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                  {dbEditSelectedTable.fields.map((field: any, index: number) => {
                    const isRelationship = field.type === "relationship";
                    const relatedRecs = isRelationship ? (allTablesRecords[field.relatedTableId] || []) : [];
                    return (
                      <div key={field.name || field.id || index} className="space-y-1 text-right">
                        <label className="block text-xs font-semibold text-gray-700">
                          {field.name} <span className="text-3xs text-gray-400 font-mono">({field.type})</span>
                        </label>
                        <div className="flex gap-2">
                          {isRelationship ? (
                            <select
                              value={dbEditNewRecordData[field.name] || ""}
                              onChange={(e) => setDbEditNewRecordData((prev: any) => ({ ...prev, [field.name]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 border rounded-lg text-xs outline-none text-right bg-white focus:border-indigo-500"
                            >
                              <option value="">-- اختر سجل مرتبط --</option>
                              {relatedRecs.map((rec) => (
                                <option key={rec.id} value={rec.id}>
                                  {rec.name || rec.Name || rec.title || rec.Title || rec.id} (ID: {rec.id?.substring(0, 6)})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              value={dbEditNewRecordData[field.name] || ''}
                              onChange={(e) => setDbEditNewRecordData((prev: any) => ({ ...prev, [field.name]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 border rounded-lg text-xs outline-none text-right placeholder-gray-300 focus:border-indigo-500"
                              placeholder={`أدخل قيمة الحقل ${field.name}...`}
                            />
                          )}
                          {!isRelationship && (
                            <SupabaseUploadWidget
                              buttonText="رفع ملف"
                              className="px-3.5 py-1 text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition shrink-0 cursor-pointer"
                              onSuccess={(url) => {
                                setDbEditNewRecordData((prev: any) => ({ ...prev, [field.name]: url }));
                                alert("✅ تم رفع الملف/الصورة بنجاح في السيرفر وتثبيت رابط الخدمة في الخلية!");
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-3xs text-gray-400 text-right leading-relaxed pt-2">
                    💡 يمكنك رفع الصور والمستندات بمرونة في أي حقل بالنقر على زر <b>(رفع ملف)</b>، فيتم تخزينها بأمان في التخزين السحابي وووضع الرابط المباشر للملف تلقائياً في السجل.
                  </p>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsDbEditAddingRecord(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleAddProjectRecord}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    حفظ السجل
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Record Modal */}
          {dbEditEditingRecord && dbEditSelectedTable && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-scale-up">
                <div className="px-6 py-4 border-b bg-indigo-50 flex justify-between items-center text-right shrink-0">
                  <h3 className="text-sm font-extrabold text-indigo-900">
                    ✍️ تعديل السجل المختار في جدول: {dbEditSelectedTable.name}
                  </h3>
                  <button
                    onClick={() => setDbEditEditingRecord(null)}
                    className="text-gray-400 hover:text-gray-700 p-1 text-md font-bold"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4 max-h-[70vh]">
                  {dbEditSelectedTable.fields.map((field: any, index: number) => {
                    const isRelationship = field.type === "relationship";
                    const relatedRecs = isRelationship ? (allTablesRecords[field.relatedTableId] || []) : [];
                    return (
                      <div key={field.name || field.id || index} className="space-y-1 text-right">
                        <label className="block text-xs font-semibold text-gray-700">
                          {field.name} <span className="text-3xs text-gray-400 font-mono">({field.type})</span>
                        </label>
                        <div className="flex gap-2">
                          {isRelationship ? (
                            <select
                              value={dbEditEditingRecord[field.name] !== undefined ? dbEditEditingRecord[field.name] : ""}
                              onChange={(e) => setDbEditEditingRecord((prev: any) => ({ ...prev, [field.name]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 border rounded-lg text-xs outline-none text-right bg-white focus:border-indigo-500"
                            >
                              <option value="">-- اختر سجل مرتبط --</option>
                              {relatedRecs.map((rec) => (
                                <option key={rec.id} value={rec.id}>
                                  {rec.name || rec.Name || rec.title || rec.Title || rec.id} (ID: {rec.id?.substring(0, 6)})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                              value={dbEditEditingRecord[field.name] !== undefined ? dbEditEditingRecord[field.name] : ''}
                              onChange={(e) => setDbEditEditingRecord((prev: any) => ({ ...prev, [field.name]: e.target.value }))}
                              className="flex-1 px-3 py-1.5 border rounded-lg text-xs outline-none text-right placeholder-gray-300 focus:border-indigo-500"
                              placeholder={`تحديث قيمة الحقل ${field.name}...`}
                            />
                          )}
                          {!isRelationship && (
                            <SupabaseUploadWidget
                              buttonText="رفع ملف"
                              className="px-3.5 py-1 text-xs bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition shrink-0 cursor-pointer"
                              onSuccess={(url) => {
                                setDbEditEditingRecord((prev: any) => ({ ...prev, [field.name]: url }));
                                alert("✅ تم رفع الملف/الصورة الجديدة وتحديث الرابط!");
                              }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-3xs text-gray-400 text-right leading-relaxed pt-2">
                    💡 يمكنك رفع مستند جديد أو تعديل البيانات يدوياً ثم النقر على حفظ التعديلات لتحديث قاعدة البيانات فوراً.
                  </p>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setDbEditEditingRecord(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdateProjectRecord}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
                  >
                    حفظ التعديلات
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {topTab === "users" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 flex flex-col" dir="rtl">
          {/* Users Header section */}
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4 shrink-0 text-right">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus className="w-6 h-6 text-indigo-600" />
                  إدارة مستخدمي التطبيق (Users Management)
                </h2>
                <p className="text-xs text-gray-500 mt-1">عرض، إضافة، وحذف حسابات الأعضاء والعملاء المسجلين في تطبيقك الحالي عبر نماذج المصادقة.</p>
              </div>

              <button
                onClick={() => {
                  setBuilderNewUserEmail('');
                  setBuilderNewUserName('');
                  setBuilderNewUserPassword('');
                  setBuilderNewUserRole('user');
                  setIsBuilderAddingUser(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer self-stretch sm:self-auto text-center justify-center mr-auto sm:mr-0"
              >
                <Plus className="w-4 h-4" /> إضافة مستخدم جديد (Add User)
              </button>
            </div>

            {/* Users Data Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-right">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3.5 text-xs font-semibold text-gray-600">البريد الإلكتروني (Email)</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-gray-600">الاسم بالكامل (Name)</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-gray-600 font-mono">كلمة المرور المسجلة</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-gray-600">الصلاحية (Role)</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-gray-600">تاريخ التسجيل</th>
                      <th className="px-5 py-3.5 text-xs font-semibold text-gray-650 text-center">حذف الحساب</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {builderSiteUsersLoading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500 text-xs font-medium">جاري تحميل الأعضاء من قاعدة البيانات...</td>
                      </tr>
                    ) : builderSiteUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-gray-500">
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UserPlus className="w-6 h-6" />
                          </div>
                          <p className="text-xs font-semibold text-gray-700">لا يوجد مستخدمون مسجلون في التطبيق حالياً.</p>
                          <p className="text-3xs text-gray-400 mt-1">سيتم إدراج أي مستخدم يقوم بالتسجيل من خلال النموذج في موقعك تلقائياً هنا في جدول users بقاعدة البيانات المخصصة.</p>
                        </td>
                      </tr>
                    ) : (
                      builderSiteUsers.map((siteUser) => (
                        <tr key={siteUser.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-4 text-xs font-semibold text-gray-900 select-all">{siteUser.email}</td>
                          <td className="px-5 py-4 text-xs text-gray-700 font-medium">{siteUser.name || "-"}</td>
                          <td className="px-5 py-4 text-xs font-mono text-gray-500 font-medium select-all" title={siteUser.password}>
                            {siteUser.password || "••••••••"}
                          </td>
                          <td className="px-5 py-4 text-xs">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-3xs font-extrabold capitalize ${
                              siteUser.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {siteUser.role === 'admin' ? 'مدير (Admin)' : 'مستخدم (User)'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-2xs text-gray-400 font-mono">
                            {siteUser.created_at ? new Date(siteUser.created_at).toLocaleString('ar-EG', { hour12: true }) : "-"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => handleBuilderDeleteUser(siteUser.id)}
                              className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                              title="إزالة هذا الحساب بشكل نهائي من قاعدة البيانات"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* User Add dialog Modal */}
          {isBuilderAddingUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-scale-up">
                <div className="px-6 py-4 bg-indigo-50 border-b text-right flex justify-between items-center shrink-0">
                  <h3 className="text-sm font-extrabold text-indigo-900">
                    👤 إضافة حساب مستخدم يدوي جديد في قاعدة البيانات
                  </h3>
                  <button
                    onClick={() => setIsBuilderAddingUser(false)}
                    className="text-gray-400 hover:text-gray-700 p-1 text-md font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleBuilderCreateUser} className="p-6 space-y-4 text-right">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-gray-700">البريد الإلكتروني للعميل *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={builderNewUserEmail}
                      onChange={(e) => setBuilderNewUserEmail(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none text-left placeholder-gray-300 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 bg-white">
                    <label className="block text-xs font-semibold text-gray-700">كلمة المرور للعميل *</label>
                    <input
                      type="password"
                      required
                      placeholder="الأرقام أو الحروف لتسجيل الدخول"
                      value={builderNewUserPassword}
                      onChange={(e) => setBuilderNewUserPassword(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none text-left placeholder-gray-300 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 pb-1">
                    <label className="block text-xs font-semibold text-gray-700">الاسم بالكامل (اختياري)</label>
                    <input
                      type="text"
                      placeholder="الاسم الأول أو العائلي"
                      value={builderNewUserName}
                      onChange={(e) => setBuilderNewUserName(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs outline-none text-right placeholder-gray-300 focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1 bg-white">
                    <label className="block text-xs font-semibold text-gray-700">الصلاحيات المصاحبة</label>
                    <select
                      value={builderNewUserRole}
                      onChange={(e: any) => setBuilderNewUserRole(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg text-xs bg-white outline-none focus:border-indigo-500"
                    >
                      <option value="user">مستخدم عادي (User)</option>
                      <option value="admin">مدير النظام (Admin)</option>
                    </select>
                  </div>

                  <div className="px-2 pt-2 border-t flex justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsBuilderAddingUser(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      إنشاء هذا الحساب
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
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

      {/* Adalo Data Picker & Relationship Explorer drawer overlay */}
      {dataPickerIsOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh] max-h-[700px] animate-scale-up">
            <div className="px-6 py-4 border-b bg-indigo-600 text-white flex justify-between items-center text-right shrink-0">
              <div>
                <h3 className="text-sm font-extrabold flex items-center gap-2">
                  <span>🪄 مستكشف العلاقات ومنتقي البيانات (Adalo Relationship Explorer)</span>
                </h3>
                <p className="text-3xs text-indigo-100 mt-1">تصفح مسارات البيانات والعلاقات بلا حدود لربطها ديناميكياً بالمكونات</p>
              </div>
              <button
                onClick={() => {
                  setDataPickerIsOpen(false);
                  setDataPickerTargetField(null);
                  setDataPickerPathStack([]);
                }}
                className="text-white/80 hover:text-white p-1 text-md font-bold"
              >
                ✕
              </button>
            </div>

            {/* Current Path Breadcrumbs */}
            <div className="bg-indigo-50 px-6 py-3 border-b flex flex-wrap items-center gap-1.5 text-xs text-indigo-950 font-bold">
              <span className="text-gray-500 font-normal">المسار الحالي:</span>
              <span 
                className={`px-1.5 py-0.5 rounded ${dataPickerPathStack.length === 0 ? "bg-indigo-200 text-indigo-900 border border-indigo-250" : "hover:underline cursor-pointer"}`}
                onClick={() => setDataPickerPathStack([])}
              >
                الرئيسية (Roots)
              </span>
              {dataPickerPathStack.map((path, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  <span className="text-gray-400 font-mono"> &gt; </span>
                  <span 
                    className={`px-1.5 py-0.5 rounded ${idx === dataPickerPathStack.length - 1 ? "bg-indigo-600 text-white" : "hover:underline cursor-pointer bg-indigo-100"}`}
                    onClick={() => setDataPickerPathStack(dataPickerPathStack.slice(0, idx + 1))}
                  >
                    {path}
                  </span>
                </span>
              ))}
            </div>

            {/* Main Tree Explorer Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-right">
              {dataPickerPathStack.length === 0 ? (
                /* Root Categories */
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-500 mb-3">حدد مصدراً للبيانات الديناميكية (Root Data Sources):</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Logged In User */}
                    <button
                      type="button"
                      onClick={() => setDataPickerPathStack(["Logged In User"])}
                      className="p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition text-right flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-2xl">👤</span>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800">العضو المسجل حالياً (Logged In User)</p>
                          <p className="text-3xs text-gray-400 mt-0.5">البيانات الشخصية للحساب النشط مثل البريد والاسم</p>
                        </div>
                      </div>
                      <span className="text-gray-400 font-mono group-hover:translate-x-[-4px] transition">&gt;</span>
                    </button>

                    {/* Current Record */}
                    <button
                      type="button"
                      onClick={() => setDataPickerPathStack(["Current Record"])}
                      className="p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition text-right flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-2xl">📝</span>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800">السجل الحالي (Current Record)</p>
                          <p className="text-3xs text-gray-400 mt-0.5">بيانات السجل المعروض بالصفحة الحالية</p>
                        </div>
                      </div>
                      <span className="text-gray-400 font-mono group-hover:translate-x-[-4px] transition">&gt;</span>
                    </button>

                    {/* Current List Item */}
                    <button
                      type="button"
                      onClick={() => setDataPickerPathStack(["Current List Item"])}
                      className="p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition text-right flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-2xl">📋</span>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800">عنصر السلسلة الحالي (Current List Item)</p>
                          <p className="text-3xs text-gray-400 mt-0.5">العنصر النشط داخل الحلقات المكررة كالقوائم</p>
                        </div>
                      </div>
                      <span className="text-gray-400 font-mono group-hover:translate-x-[-4px] transition">&gt;</span>
                    </button>

                    {/* URL Parameters */}
                    <button
                      type="button"
                      onClick={() => setDataPickerPathStack(["URL Parameters"])}
                      className="p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition text-right flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-2xl">🔗</span>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800">مغيرات الرابط (URL Parameters)</p>
                          <p className="text-3xs text-gray-400 mt-0.5">المتغيرات الممررة في شريط عنوان المتصفح</p>
                        </div>
                      </div>
                      <span className="text-gray-400 font-mono group-hover:translate-x-[-4px] transition">&gt;</span>
                    </button>

                    {/* Custom & Local State */}
                    <button
                      type="button"
                      onClick={() => setDataPickerPathStack(["Custom State"])}
                      className="p-4 border rounded-xl hover:border-indigo-500 hover:bg-indigo-50/50 transition text-right flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="text-2xl">⚙️</span>
                        <div>
                          <p className="text-xs font-extrabold text-gray-800">حالة الذاكرة المؤقتة (Local State)</p>
                          <p className="text-3xs text-gray-400 mt-0.5">المتغيرات المحلية للمتصفح وحالة الصفحة</p>
                        </div>
                      </div>
                      <span className="text-gray-400 font-mono group-hover:translate-x-[-4px] transition">&gt;</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Inside a node path - traverse fields and relations dynamically */
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-xs font-bold text-gray-600">عناصر وحقول المستوى الحالي:</span>
                    <button 
                      type="button"
                      className="text-3xs text-indigo-600 hover:underline cursor-pointer"
                      onClick={() => setDataPickerPathStack(prev => prev.slice(0, -1))}
                    >
                      ↩ رجوع مستوى واحد للوراء
                    </button>
                  </div>

                  {/* Resolve schema of the current node path */}
                  {(() => {
                    const currentRoot = dataPickerPathStack[0];
                    let currentTableId = "";
                    
                    if (currentRoot === "Logged In User") {
                      currentTableId = "site_users";
                    } else {
                      let resolvedTable = null;
                      if (dataPickerPathStack.length === 1) {
                        resolvedTable = dbEditSelectedTable;
                      } else {
                        let walkTable = dbEditSelectedTable || userTables.find(t => t.id === "site_users");
                        for (let i = 1; i < dataPickerPathStack.length; i++) {
                          const stepName = dataPickerPathStack[i];
                          const relField = walkTable?.fields?.find((f: any) => f.name === stepName && f.type === "relationship");
                          if (relField) {
                            walkTable = userTables.find(t => t.id === relField.relatedTableId);
                          }
                        }
                        resolvedTable = walkTable;
                      }
                      currentTableId = resolvedTable?.id || "";
                    }

                    const resolvedTable = userTables.find(t => t.id === currentTableId) || dbEditSelectedTable;
                    
                    if (!resolvedTable) {
                      return (
                        <div className="text-center py-8">
                          <p className="text-xs text-gray-500">لا توجد حقول أو علاقات معرفة لهذا المسار بعد.</p>
                          <button
                            type="button"
                            onClick={() => handleSelectToken(dataPickerPathStack.join(" > "))}
                            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded text-xs"
                          >
                            اختيار هذا الجزء كلياً
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="divide-y border rounded-xl bg-white overflow-hidden">
                        {resolvedTable.fields.map((field: any, idx: number) => {
                          const isRel = field.type === "relationship";
                          const fullFieldPath = [...dataPickerPathStack, field.name].join(" > ");
                          
                          if (isRel) {
                            return (
                              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                  <span className="text-sm">🔗</span>
                                  <div>
                                    <p className="text-xs font-bold text-gray-800">{field.name} (علاقة)</p>
                                    <p className="text-3xs text-gray-400 mt-0.5">
                                      مرتبط بجدول: {userTables.find(t => t.id === field.relatedTableId)?.name || field.relatedTableId} ({field.relationType})
                                    </p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectToken(`COUNT(${fullFieldPath})`)}
                                    className="px-2 py-1 text-3xs font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded cursor-pointer transition"
                                    title="حساب عدد العناصر المرتبطة تلقائياً كـ COUNT"
                                  >
                                    🧮 COUNT
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDataPickerPathStack([...dataPickerPathStack, field.name])}
                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  >
                                    دخول العلاقات &gt;
                                  </button>
                                </div>
                              </div>
                            );
                          } else {
                            return (
                              <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-gray-50 transition">
                                <div className="flex items-center space-x-3 space-x-reverse">
                                  <span className="text-sm">🔹</span>
                                  <div>
                                    <p className="text-xs font-bold text-gray-800">{field.name}</p>
                                    <p className="text-3xs text-gray-400 font-mono mt-0.5">نوع الحقل: {field.type}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSelectToken(fullFieldPath)}
                                  className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold cursor-pointer shadow-xs"
                                >
                                  إدراج الحقل
                                </button>
                              </div>
                            );
                          }
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center shrink-0" dir="rtl">
              <span className="text-3xs text-gray-405">💡 المسار المستخرج سيتحول ديناميكياً عند فتح التطبيق ليمد المكون بالبيانات المطلوبة</span>
              <button
                type="button"
                onClick={() => {
                  setDataPickerIsOpen(false);
                  setDataPickerTargetField(null);
                  setDataPickerPathStack([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-medium cursor-pointer"
              >
                إغلاق المستكشف
              </button>
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
