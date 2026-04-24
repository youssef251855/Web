"use client";

import { useEffect, useState, useRef, memo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { useBuilderStore, ElementType, PageElement } from "@/lib/builder-store";
import { motion } from "motion/react";
import {
  ArrowLeft,
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
} from "lucide-react";
import CloudinaryUploadWidget from "@/components/CloudinaryUploadWidget";
import ActionEditor from "@/components/ActionEditor";
import Renderer from "@/components/Renderer";

const SIDEBAR_CATEGORIES = [
  {
    name: "Layout & Basic",
    items: [
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
    name: "Advanced & Custom",
    items: [
      { type: "nav_bar", icon: PanelBottom, label: "Nav Bar" },
      { type: "product_card", icon: Tag, label: "Product Card" },
      { type: "blog_card", icon: Code, label: "Blog Card" },
      { type: "stats_grid", icon: BarChart, label: "Stats Grid" },
      { type: "timeline", icon: ListOrdered, label: "Timeline" },
      { type: "carousel", icon: ImageIcon, label: "Carousel" },
      { type: "date_picker", icon: Clock, label: "Date Picker" },
      { type: "file_upload", icon: Check, label: "File Upload" },
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
    ] as { type: ElementType; icon: any; label: string }[],
  },
];

export default function BuilderPage() {
  const { id } = useParams();
  const { user, username, loading } = useAuth();
  const router = useRouter();
  const elements = useBuilderStore(s => s.elements);
  const setElements = useBuilderStore(s => s.setElements);
  const variables = useBuilderStore(s => s.variables);
  const setVariables = useBuilderStore(s => s.setVariables);
  const addElement = useBuilderStore(s => s.addElement);
  const updateElement = useBuilderStore(s => s.updateElement);
  const removeElement = useBuilderStore(s => s.removeElement);
  const selectedElementId = useBuilderStore(s => s.selectedElementId);
  const selectElement = useBuilderStore(s => s.selectElement);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [topTab, setTopTab] = useState<
    "editor" | "database" | "users" | "settings"
  >("editor");
  const [mobileView, setMobileView] = useState<
    "elements" | "canvas" | "properties"
  >("canvas");
  const [leftTab, setLeftTab] = useState<"elements" | "variables">("elements");
  const [userPages, setUserPages] = useState<
    { id: string; title: string; slug: string }[]
  >([]);
  const [userTables, setUserTables] = useState<
    { id: string; name: string; fields: any[] }[]
  >([]);
  const [userSettings, setUserSettings] = useState<{
    cloudinaryCloudName?: string;
    cloudinaryUploadPreset?: string;
  } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPage = async () => {
      if (!user || !id) return;
      const docRef = doc(db, "pages", id as string);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists() && docSnap.data().userId === user.uid) {
        setPageTitle(docSnap.data().title);
        setPageSlug(docSnap.data().slug);
        setPageDescription(docSnap.data().description || "");
        const content = JSON.parse(docSnap.data().content);
        setElements(content.elements || []);
        setVariables(content.variables || []);
      } else {
        router.push("/dashboard");
      }
    };
    fetchPage();
  }, [id, user, router, setElements, setVariables]);

  useEffect(() => {
    const fetchUserPagesAndTables = async () => {
      if (!user) return;

      const qPages = query(
        collection(db, "pages"),
        where("userId", "==", user.uid),
      );
      const snapPages = await getDocs(qPages);
      const pages = snapPages.docs.map((d) => ({
        id: d.id,
        title: d.data().title,
        slug: d.data().slug,
      }));
      setUserPages(pages);

      const qTables = query(
        collection(db, "tables"),
        where("userId", "==", user.uid),
      );
      const snapTables = await getDocs(qTables);
      const tables = snapTables.docs.map((d) => ({
        id: d.id,
        name: d.data().name,
        fields: JSON.parse(d.data().fields || "[]"),
      }));
      setUserTables(tables);

      const settingsSnap = await getDoc(doc(db, "user_settings", user.uid));
      if (settingsSnap.exists()) {
        setUserSettings(settingsSnap.data());
      }
    };
    fetchUserPagesAndTables();
  }, [user]);

  const handleSave = async () => {
    if (!user || !id) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "pages", id as string), {
        title: pageTitle,
        slug: pageSlug,
        description: pageDescription,
        content: JSON.stringify({ elements, variables }),
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving page", error);
    } finally {
      setSaving(false);
    }
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
        return `/${pageSlug}`;
      }

      const protocol = rootDomain.includes("localhost") ? "http" : "https";
      return `${protocol}://${username}.${rootDomain}/${pageSlug}`;
    }
    return `/${pageSlug}`;
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
  useEffect(() => {
    if (!user || !id || elements.length === 0) return;

    const timeoutId = setTimeout(() => {
      handleSave();
    }, 2000); // Auto save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, user, id]);

  const handleAddElement = (type: ElementType) => {
    // Add to center of canvas roughly
    addElement(type, { x: 50, y: 50 });
    setMobileView("canvas");
  };

  const selectedElement = elements.find((el) => el.id === selectedElementId);

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

      case "form":
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
        return (
          <textarea
            value={selectedElement.content as string}
            onChange={(e) =>
              updateElement(selectedElement.id, { content: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-md text-sm font-mono"
            rows={6}
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
            {selectedElement.type === "image" &&
              userSettings?.cloudinaryCloudName &&
              userSettings?.cloudinaryUploadPreset && (
                <div className="pt-2">
                  <CloudinaryUploadWidget
                    cloudName={userSettings.cloudinaryCloudName}
                    uploadPreset={userSettings.cloudinaryUploadPreset}
                    onSuccess={(url) =>
                      updateElement(selectedElement.id, { content: url })
                    }
                    className="w-full"
                  />
                </div>
              )}
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
            onClick={() => window.open(getPublicUrl(), "_blank")}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md flex items-center text-sm hover:bg-gray-200 transition"
          >
            Preview
          </button>
          <button
            onClick={handleSave}
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
              <div className="flex border-b shrink-0">
                <button
                  onClick={() => setLeftTab("elements")}
                  className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${leftTab === "elements" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                >
                  Elements
                </button>
                <button
                  onClick={() => setLeftTab("variables")}
                  className={`flex-1 py-3 text-sm font-semibold uppercase tracking-wider ${leftTab === "variables" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                >
                  Variables
                </button>
              </div>

              <div className="flex-1 overflow-y-auto hidden-scrollbar">
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
                              className="flex flex-col items-center justify-center p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition bg-gray-50"
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
              className={`${mobileView === "canvas" ? "flex" : "hidden"} md:flex flex-1 relative overflow-auto bg-gray-200 p-4 md:p-8`}
              onClick={() => selectElement(null)}
            >
              <div
                ref={canvasRef}
                className="w-full max-w-4xl mx-auto min-h-[800px] bg-white shadow-sm relative"
                style={{ width: "800px" }}
              >
                {elements.map((el) => (
                  <BuilderElement
                    key={el.id}
                    element={el}
                    canvasRef={canvasRef}
                    onSelect={() => setMobileView("properties")}
                  />
                ))}
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

                    {selectedElement.style.color !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Text Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.style.color}
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

                    {selectedElement.style.backgroundColor !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Background Color
                        </label>
                        <input
                          type="color"
                          value={selectedElement.style.backgroundColor}
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

                    {selectedElement.style.fontSize !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Font Size
                        </label>
                        <input
                          type="text"
                          value={selectedElement.style.fontSize}
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

                    {selectedElement.style.width !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Width
                        </label>
                        <input
                          type="text"
                          value={selectedElement.style.width}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                width: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    )}

                    {selectedElement.style.height !== undefined && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Height
                        </label>
                        <input
                          type="text"
                          value={selectedElement.style.height}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              style: {
                                ...selectedElement.style,
                                height: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* Database Connection */}
                  {(selectedElement.type === "list" ||
                    selectedElement.type === "form") && (
                    <div className="space-y-4 mt-4 border-t pt-4">
                      <h3 className="text-sm font-medium text-gray-900">
                        Database Connection
                      </h3>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          Connect to Collection
                        </label>
                        <select
                          value={selectedElement.dataSource?.tableId || ""}
                          onChange={(e) =>
                            updateElement(selectedElement.id, {
                              dataSource: { tableId: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="">-- Select a Collection --</option>
                          {userTables.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {selectedElement.dataSource?.tableId &&
                        selectedElement.type === "list" && (
                          <div className="text-xs text-green-600 bg-green-50 p-2 rounded-md border border-green-100">
                            Connected to{" "}
                            <b>
                              {
                                userTables.find(
                                  (t) =>
                                    t.id ===
                                    selectedElement.dataSource?.tableId,
                                )?.name
                              }
                            </b>
                            . In preview, this list will display dynamic
                            results.
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
                    </div>
                  )}

                  {/* Workflows Edit */}
                  <ActionEditor
                    element={selectedElement}
                    updateElement={updateElement}
                    userPages={userPages}
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
                  onClick={handleSave}
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
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white flex flex-col items-center justify-center">
          <TableIcon className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            Database Connection
          </h2>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            Manage data mapped to your Dynamic Lists and Forms.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Go to Database Dashboard
          </button>
        </div>
      )}

      {topTab === "users" && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white flex flex-col items-center justify-center">
          <UserPlus className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            User Management
          </h2>
          <p className="text-gray-500 text-center max-w-sm mb-6">
            View and manage users who signed up through your site&apos;s Auth forms.
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
                <button
                  onClick={() => window.open(getPublicUrl(), "_blank")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                  Visit Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BuilderElement = memo(function BuilderElement({
  element,
  canvasRef,
  onSelect,
}: {
  element: PageElement;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  onSelect: () => void;
}) {
  const selectElement = useBuilderStore(state => state.selectElement);
  const isSelected = useBuilderStore(state => state.selectedElementId === element.id);
  const updateElement = useBuilderStore(state => state.updateElement);

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
        onSelect();
      }}
      style={{
        position: "absolute",
        left: element.position?.x || 0,
        top: element.position?.y || 0,
        x: 0,
        y: 0,
      }}
      className={`cursor-move ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : "hover:ring-1 hover:ring-gray-300 hover:ring-offset-1"}`}
    >
      <Renderer elements={[element]} isBuilderMode={true} />
    </motion.div>
  );
});
