import { Bot, BookOpen, Check, Clock, Copy, Eye, EyeOff, Image, Link, MessageCircle, Pencil, Search, Send, Share2, Sunrise, Trash2, Umbrella, Undo2, User, X } from "lucide";

const ICON_NODES = { Bot, BookOpen, Check, Clock, Copy, Eye, EyeOff, Image, Link, MessageCircle, Pencil, Search, Send, Share2, Sunrise, Trash2, Umbrella, Undo2, User, X };

const esc = (s) => String(s ?? "").replace(/"/g, "&quot;");

function node(tag, attrs) {
  const a = Object.entries(attrs ?? {})
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(" ");
  return `<${tag} ${a}/>`;
}

export function lucide(name, { size = 24, ...attrs } = {}) {
  const nodes = ICON_NODES[name];
  if (!nodes) return "";
  const base = {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    ...attrs,
  };
  const a = Object.entries(base)
    .map(([k, v]) => `${k}="${esc(v)}"`)
    .join(" ");
  return `<svg ${a}>${nodes.map(([t, at]) => node(t, at)).join("")}</svg>`;
}

export const icons = {
  bot: (o) => lucide("Bot", o),
  bookOpen: (o) => lucide("BookOpen", o),
  check: (o) => lucide("Check", o),
  clock: (o) => lucide("Clock", o),
  copy: (o) => lucide("Copy", o),
  eye: (o) => lucide("Eye", o),
  eyeOff: (o) => lucide("EyeOff", o),
  image: (o) => lucide("Image", o),
  link: (o) => lucide("Link", o),
  messageCircle: (o) => lucide("MessageCircle", o),
  pencil: (o) => lucide("Pencil", o),
  search: (o) => lucide("Search", o),
  send: (o) => lucide("Send", o),
  share2: (o) => lucide("Share2", o),
  sunrise: (o) => lucide("Sunrise", o),
  trash: (o) => lucide("Trash2", o),
  umbrella: (o) => lucide("Umbrella", o),
  undo: (o) => lucide("Undo2", o),
  user: (o) => lucide("User", o),
  x: (o) => lucide("X", o),
};
