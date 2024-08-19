/* eslint-disable @typescript-eslint/no-explicit-any */
import { BoolAttr, ReactiveAttr, Ref } from "~/signals";
import { Properties, PropertiesHyphen } from "csstype";

type RemovePrefix<T, Prefix extends string> = T extends `${Prefix}${infer S}` ? S : T;
type OnEventName = Exclude<keyof GlobalEventHandlers, `${string}EventListener`>;
type EventName = RemovePrefix<OnEventName, "on">;

type ExtractEvent<T extends OnEventName> =
  GlobalEventHandlers[T] extends (((this: GlobalEventHandlers, ev: infer K) => any) | null) ? K : never;

type SpecialProps = {
  "$if"?: boolean,
};

type EventHandler<T> = {
  [K in `on:${EventName}`]: ((this: T, ev: ExtractEvent<`on${RemovePrefix<K, "on:">}`>) => void) | null;
};

type Union<T> = T extends any ? T : never;
type RefUnion<T> = T extends any ? Ref<T> : never;

type StripPrefix<T, K, Prefix extends string> = RemovePrefix<K, Prefix> extends keyof T ?
  T[RemovePrefix<K, Prefix>] : never;

type StyleProps = {
  [K in `style:${keyof PropertiesHyphen}`]?: RefUnion<StripPrefix<PropertiesHyphen, K, "style:">> | string;
} & { [K in `var:${string}`]?: string } & { [K in `class:${string}`]?: BoolAttr };

type Binders<T> = T & (
  keyof T extends string ? {
    [K in `bind:${keyof T}`]?: RefUnion<StripPrefix<T, K, "bind:">>;
  } & StyleProps : never
);

type HTMLAttributeAnchorTarget =
  | "_self"
  | "_blank"
  | "_parent"
  | "_top"
  | (string & NonNullable<unknown>);

type HTMLAttributeReferrerPolicy =
  | ""
  | "no-referrer"
  | "no-referrer-when-downgrade"
  | "origin"
  | "origin-when-cross-origin"
  | "same-origin"
  | "strict-origin"
  | "strict-origin-when-cross-origin"
  | "unsafe-url";

interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
  download?: any;
  href?: string | undefined;
  hreflang?: string | undefined;
  media?: string | undefined;
  ping?: string | undefined;
  target?: HTMLAttributeAnchorTarget | undefined;
  type?: string | undefined;
  referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
}

interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
  alt?: string | undefined;
  coords?: string | undefined;
  download?: any;
  href?: string | undefined;
  hreflang?: string | undefined;
  media?: string | undefined;
  referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
  shape?: string | undefined;
  target?: string | undefined;
}

interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
  href?: string | undefined;
  target?: string | undefined;
}

interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined;
}

interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined;
  form?: string | undefined;
  formaction?:
  | string
  | NonNullable<unknown>[
  keyof NonNullable<unknown>
  ]
  | undefined;
  formenctype?: string | undefined;
  formmethod?: string | undefined;
  formnovalidate?: boolean | undefined;
  formtarget?: string | undefined;
  name?: string | undefined;
  type?: "submit" | "reset" | "button" | undefined;
  value?: string | readonly string[] | number | undefined;
}

interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: number | string | undefined;
  width?: number | string | undefined;
}

interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
  span?: number | undefined;
  width?: number | string | undefined;
}

interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  span?: number | undefined;
}

interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: string | readonly string[] | number | undefined;
}

interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
  open?: boolean | undefined;
  name?: string | undefined;
}

interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined;
  datetime?: string | undefined;
}

interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
  open?: boolean | undefined;
}

interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: number | string | undefined;
  src?: string | undefined;
  type?: string | undefined;
  width?: number | string | undefined;
}

interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined;
  form?: string | undefined;
  name?: string | undefined;
}

interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
  "accept-charset"?: string | undefined;
  action?:
  | string
  | undefined
  | NonNullable<unknown>[
  keyof NonNullable<unknown>
  ];
  autocomplete?: string | undefined;
  enctype?: string | undefined;
  method?: string | undefined;
  name?: string | undefined;
  novalidate?: boolean | undefined;
  target?: string | undefined;
}

interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
  manifest?: string | undefined;
}

interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
  allow?: string | undefined;
  allowfullscreen?: boolean | undefined;
  allowtransparency?: boolean | undefined;
  /** @deprecated */
  frameborder?: number | string | undefined;
  height?: number | string | undefined;
  loading?: "eager" | "lazy" | undefined;
  /** @deprecated */
  marginheight?: number | undefined;
  /** @deprecated */
  marginwidth?: number | undefined;
  name?: string | undefined;
  referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
  sandbox?: string | undefined;
  /** @deprecated */
  scrolling?: string | undefined;
  seamless?: boolean | undefined;
  src?: string | undefined;
  srcdoc?: string | undefined;
  width?: number | string | undefined;
}

type CrossOrigin = "anonymous" | "use-credentials" | "" | undefined;

interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
  alt?: string | undefined;
  crossorigin?: CrossOrigin;
  decoding?: "async" | "auto" | "sync" | undefined;
  fetchpriority?: "high" | "low" | "auto";
  height?: number | string | undefined;
  loading?: "eager" | "lazy" | undefined;
  referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
  sizes?: string | undefined;
  src?: string | undefined;
  srcset?: string | undefined;
  usemap?: string | undefined;
  width?: number | string | undefined;
}

interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined;
  datetime?: string | undefined;
}

type HTMLInputTypeAttribute =
  | "button"
  | "checkbox"
  | "color"
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "hidden"
  | "image"
  | "month"
  | "number"
  | "password"
  | "radio"
  | "range"
  | "reset"
  | "search"
  | "submit"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week"
  | (string & NonNullable<unknown>);

type AutoFillAddressKind = "billing" | "shipping";
type AutoFillBase = "" | "off" | "on";
type AutoFillContactField =
  | "email"
  | "tel"
  | "tel-area-code"
  | "tel-country-code"
  | "tel-extension"
  | "tel-local"
  | "tel-local-prefix"
  | "tel-local-suffix"
  | "tel-national";
type AutoFillContactKind = "home" | "mobile" | "work";
type AutoFillCredentialField = "webauthn";
type AutoFillNormalField =
  | "additional-name"
  | "address-level1"
  | "address-level2"
  | "address-level3"
  | "address-level4"
  | "address-line1"
  | "address-line2"
  | "address-line3"
  | "bday-day"
  | "bday-month"
  | "bday-year"
  | "cc-csc"
  | "cc-exp"
  | "cc-exp-month"
  | "cc-exp-year"
  | "cc-family-name"
  | "cc-given-name"
  | "cc-name"
  | "cc-number"
  | "cc-type"
  | "country"
  | "country-name"
  | "current-password"
  | "family-name"
  | "given-name"
  | "honorific-prefix"
  | "honorific-suffix"
  | "name"
  | "new-password"
  | "one-time-code"
  | "organization"
  | "postal-code"
  | "street-address"
  | "transaction-amount"
  | "transaction-currency"
  | "username";
type OptionalPrefixToken<T extends string> = `${T} ` | "";
type OptionalPostfixToken<T extends string> = ` ${T}` | "";
type AutoFillField = AutoFillNormalField | `${OptionalPrefixToken<AutoFillContactKind>}${AutoFillContactField}`;
type AutoFillSection = `section-${string}`;
type AutoFill =
  | AutoFillBase
  | `${OptionalPrefixToken<AutoFillSection>}${OptionalPrefixToken<
    AutoFillAddressKind
  >}${AutoFillField}${OptionalPostfixToken<AutoFillCredentialField>}`;
type HTMLInputAutoCompleteAttribute = AutoFill | (string & NonNullable<unknown>);

interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
  accept?: string | undefined;
  alt?: string | undefined;
  autocomplete?: HTMLInputAutoCompleteAttribute | undefined;
  capture?: boolean | "user" | "environment" | undefined; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
  checked?: boolean | undefined;
  disabled?: boolean | undefined;
  enterkeyhint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send" | undefined;
  form?: string | undefined;
  formaction?:
  | string
  | NonNullable<unknown>
  | undefined;
  formenctype?: string | undefined;
  formmethod?: string | undefined;
  formnovalidate?: boolean | undefined;
  formtarget?: string | undefined;
  height?: number | string | undefined;
  list?: string | undefined;
  max?: number | string | undefined;
  maxlength?: number | undefined;
  min?: number | string | undefined;
  minlength?: number | undefined;
  multiple?: boolean | undefined;
  name?: string | undefined;
  pattern?: string | undefined;
  placeholder?: string | undefined;
  readonly?: boolean | undefined;
  required?: boolean | undefined;
  size?: number | undefined;
  src?: string | undefined;
  step?: number | string | undefined;
  type?: HTMLInputTypeAttribute | undefined;
  value?: string | readonly string[] | number | undefined;
  width?: number | string | undefined;
}

interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
  challenge?: string | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  keytype?: string | undefined;
  keyparams?: string | undefined;
  name?: string | undefined;
}

interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: string | undefined;
  for?: string | undefined;
  htmlFor?: string | undefined;
}

interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
  value?: string | readonly string[] | number | undefined;
}

interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
  as?: string | undefined;
  crossorigin?: CrossOrigin;
  fetchpriority?: "high" | "low" | "auto";
  href?: string | undefined;
  hreflang?: string | undefined;
  integrity?: string | undefined;
  media?: string | undefined;
  imagesrcset?: string | undefined;
  imagesizes?: string | undefined;
  referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
  sizes?: string | undefined;
  type?: string | undefined;
  charset?: string | undefined;
}

interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: string | undefined;
}

interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
  type?: string | undefined;
}

interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
  autoplay?: boolean | undefined;
  controls?: boolean | undefined;
  controlslist?: string | undefined;
  crossorigin?: CrossOrigin;
  loop?: boolean | undefined;
  mediagroup?: string | undefined;
  muted?: boolean | undefined;
  playsinline?: boolean | undefined;
  preload?: string | undefined;
  src?: string | undefined;
}

interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
  charset?: string | undefined;
  content?: string | undefined;
  "http-equiv"?: string | undefined;
  media?: string | undefined;
  name?: string | undefined;
}

interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: string | undefined;
  high?: number | undefined;
  low?: number | undefined;
  max?: number | string | undefined;
  min?: number | string | undefined;
  optimum?: number | undefined;
  value?: string | readonly string[] | number | undefined;
}

interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
  cite?: string | undefined;
}

interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
  classid?: string | undefined;
  data?: string | undefined;
  form?: string | undefined;
  height?: number | string | undefined;
  name?: string | undefined;
  type?: string | undefined;
  usemap?: string | undefined;
  width?: number | string | undefined;
  wmode?: string | undefined;
}

interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
  reversed?: boolean | undefined;
  start?: number | undefined;
  type?: "1" | "a" | "A" | "i" | "I" | undefined;
}

interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined;
  label?: string | undefined;
}

interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
  disabled?: boolean | undefined;
  label?: string | undefined;
  selected?: boolean | undefined;
  value?: string | readonly string[] | number | undefined;
}

interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
  form?: string | undefined;
  for?: string | undefined;
  htmlFor?: string | undefined;
  name?: string | undefined;
}

interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: string | undefined;
  value?: string | readonly string[] | number | undefined;
}

interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
  max?: number | string | undefined;
  value?: string | readonly string[] | number | undefined;
}

interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
  name?: string | undefined;
}

interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
  async?: boolean | undefined;
  /** @deprecated */
  charset?: string | undefined;
  crossorigin?: CrossOrigin;
  defer?: boolean | undefined;
  integrity?: string | undefined;
  nomodule?: boolean | undefined;
  referrerpolicy?: HTMLAttributeReferrerPolicy | undefined;
  src?: string | undefined;
  type?: string | undefined;
}

interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
  autocomplete?: string | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  multiple?: boolean | undefined;
  name?: string | undefined;
  required?: boolean | undefined;
  size?: number | undefined;
  value?: string | readonly string[] | number | undefined;
}

interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
  height?: number | string | undefined;
  media?: string | undefined;
  sizes?: string | undefined;
  src?: string | undefined;
  srcset?: string | undefined;
  type?: string | undefined;
  width?: number | string | undefined;
}

interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
  media?: string | undefined;
  scoped?: boolean | undefined;
  type?: string | undefined;
}

interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: "left" | "center" | "right" | undefined;
  bgcolor?: string | undefined;
  border?: number | undefined;
  cellpadding?: number | string | undefined;
  cellspacing?: number | string | undefined;
  frame?: boolean | undefined;
  rules?: "none" | "groups" | "rows" | "columns" | "all" | undefined;
  summary?: string | undefined;
  width?: number | string | undefined;
}

interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
  autocomplete?: string | undefined;
  cols?: number | undefined;
  dirname?: string | undefined;
  disabled?: boolean | undefined;
  form?: string | undefined;
  maxlength?: number | undefined;
  minlength?: number | undefined;
  name?: string | undefined;
  placeholder?: string | undefined;
  readonly?: boolean | undefined;
  required?: boolean | undefined;
  rows?: number | undefined;
  value?: string | readonly string[] | number | undefined;
  wrap?: string | undefined;
}

interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: "left" | "center" | "right" | "justify" | "char" | undefined;
  colspan?: number | undefined;
  headers?: string | undefined;
  rowspan?: number | undefined;
  scope?: string | undefined;
  abbr?: string | undefined;
  height?: number | string | undefined;
  width?: number | string | undefined;
  valign?: "top" | "middle" | "bottom" | "baseline" | undefined;
}

interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
  align?: "left" | "center" | "right" | "justify" | "char" | undefined;
  colspan?: number | undefined;
  headers?: string | undefined;
  rowspan?: number | undefined;
  scope?: string | undefined;
  abbr?: string | undefined;
}

interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
  datetime?: string | undefined;
}

interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
  default?: boolean | undefined;
  kind?: string | undefined;
  label?: string | undefined;
  src?: string | undefined;
  srclang?: string | undefined;
}

interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
  height?: number | string | undefined;
  playsinline?: boolean | undefined;
  poster?: string | undefined;
  width?: number | string | undefined;
  disablepictureinpicture?: boolean | undefined;
  disableremoteplayback?: boolean | undefined;
}

interface AriaAttributes {
  /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
  "aria-activedescendant"?: string | undefined;
  /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
  "aria-atomic"?: BoolAttr | undefined;
  /**
   * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
   * presented if they are made.
   */
  "aria-autocomplete"?: "none" | "inline" | "list" | "both" | undefined;
  /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
  /**
   * Defines a string value that labels the current element, which is intended to be converted into Braille.
   * @see aria-label.
   */
  "aria-braillelabel"?: string | undefined;
  /**
   * Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.
   * @see aria-roledescription.
   */
  "aria-brailleroledescription"?: string | undefined;
  "aria-busy"?: BoolAttr | undefined;
  /**
   * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
   * @see aria-pressed @see aria-selected.
   */
  "aria-checked"?: boolean | "false" | "mixed" | "true" | undefined;
  /**
   * Defines the total number of columns in a table, grid, or treegrid.
   * @see aria-colindex.
   */
  "aria-colcount"?: number | undefined;
  /**
   * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
   * @see aria-colcount @see aria-colspan.
   */
  "aria-colindex"?: number | undefined;
  /**
   * Defines a human readable text alternative of aria-colindex.
   * @see aria-rowindextext.
   */
  "aria-colindextext"?: string | undefined;
  /**
   * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
   * @see aria-colindex @see aria-rowspan.
   */
  "aria-colspan"?: number | undefined;
  /**
   * Identifies the element (or elements) whose contents or presence are controlled by the current element.
   * @see aria-owns.
   */
  "aria-controls"?: string | undefined;
  /** Indicates the element that represents the current item within a container or set of related elements. */
  "aria-current"?: boolean | "false" | "true" | "page" | "step" | "location" | "date" | "time" | undefined;
  /**
   * Identifies the element (or elements) that describes the object.
   * @see aria-labelledby
   */
  "aria-describedby"?: string | undefined;
  /**
   * Defines a string value that describes or annotates the current element.
   * @see related aria-describedby.
   */
  "aria-description"?: string | undefined;
  /**
   * Identifies the element that provides a detailed, extended description for the object.
   * @see aria-describedby.
   */
  "aria-details"?: string | undefined;
  /**
   * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
   * @see aria-hidden @see aria-readonly.
   */
  "aria-disabled"?: BoolAttr | undefined;
  /**
   * Indicates what functions can be performed when a dragged object is released on the drop target.
   * @deprecated in ARIA 1.1
   */
  "aria-dropeffect"?: "none" | "copy" | "execute" | "link" | "move" | "popup" | undefined;
  /**
   * Identifies the element that provides an error message for the object.
   * @see aria-invalid @see aria-describedby.
   */
  "aria-errormessage"?: string | undefined;
  /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
  "aria-expanded"?: BoolAttr | undefined;
  /**
   * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
   * allows assistive technology to override the general default of reading in document source order.
   */
  "aria-flowto"?: string | undefined;
  /**
   * Indicates an element's "grabbed" state in a drag-and-drop operation.
   * @deprecated in ARIA 1.1
   */
  "aria-grabbed"?: BoolAttr | undefined;
  /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
  "aria-haspopup"?: boolean | "false" | "true" | "menu" | "listbox" | "tree" | "grid" | "dialog" | undefined;
  /**
   * Indicates whether the element is exposed to an accessibility API.
   * @see aria-disabled.
   */
  "aria-hidden"?: BoolAttr | undefined;
  /**
   * Indicates the entered value does not conform to the format expected by the application.
   * @see aria-errormessage.
   */
  "aria-invalid"?: boolean | "false" | "true" | "grammar" | "spelling" | undefined;
  /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
  "aria-keyshortcuts"?: string | undefined;
  /**
   * Defines a string value that labels the current element.
   * @see aria-labelledby.
   */
  "aria-label"?: string | undefined;
  /**
   * Identifies the element (or elements) that labels the current element.
   * @see aria-describedby.
   */
  "aria-labelledby"?: string | undefined;
  /** Defines the hierarchical level of an element within a structure. */
  "aria-level"?: number | undefined;
  /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
  "aria-live"?: "off" | "assertive" | "polite" | undefined;
  /** Indicates whether an element is modal when displayed. */
  "aria-modal"?: BoolAttr | undefined;
  /** Indicates whether a text box accepts multiple lines of input or only a single line. */
  "aria-multiline"?: BoolAttr | undefined;
  /** Indicates that the user may select more than one item from the current selectable descendants. */
  "aria-multiselectable"?: BoolAttr | undefined;
  /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
  "aria-orientation"?: "horizontal" | "vertical" | undefined;
  /**
   * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
   * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
   * @see aria-controls.
   */
  "aria-owns"?: string | undefined;
  /**
   * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
   * A hint could be a sample value or a brief description of the expected format.
   */
  "aria-placeholder"?: string | undefined;
  /**
   * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
   * @see aria-setsize.
   */
  "aria-posinset"?: number | undefined;
  /**
   * Indicates the current "pressed" state of toggle buttons.
   * @see aria-checked @see aria-selected.
   */
  "aria-pressed"?: boolean | "false" | "mixed" | "true" | undefined;
  /**
   * Indicates that the element is not editable, but is otherwise operable.
   * @see aria-disabled.
   */
  "aria-readonly"?: BoolAttr | undefined;
  /**
   * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
   * @see aria-atomic.
   */
  "aria-relevant"?:
  | "additions"
  | "additions removals"
  | "additions text"
  | "all"
  | "removals"
  | "removals additions"
  | "removals text"
  | "text"
  | "text additions"
  | "text removals"
  | undefined;
  /** Indicates that user input is required on the element before a form may be submitted. */
  "aria-required"?: BoolAttr | undefined;
  /** Defines a human-readable, author-localized description for the role of an element. */
  "aria-roledescription"?: string | undefined;
  /**
   * Defines the total number of rows in a table, grid, or treegrid.
   * @see aria-rowindex.
   */
  "aria-rowcount"?: number | undefined;
  /**
   * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
   * @see aria-rowcount @see aria-rowspan.
   */
  "aria-rowindex"?: number | undefined;
  /**
   * Defines a human readable text alternative of aria-rowindex.
   * @see aria-colindextext.
   */
  "aria-rowindextext"?: string | undefined;
  /**
   * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
   * @see aria-rowindex @see aria-colspan.
   */
  "aria-rowspan"?: number | undefined;
  /**
   * Indicates the current "selected" state of various widgets.
   * @see aria-checked @see aria-pressed.
   */
  "aria-selected"?: BoolAttr | undefined;
  /**
   * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
   * @see aria-posinset.
   */
  "aria-setsize"?: number | undefined;
  /** Indicates if items in a table or grid are sorted in ascending or descending order. */
  "aria-sort"?: "none" | "ascending" | "descending" | "other" | undefined;
  /** Defines the maximum allowed value for a range widget. */
  "aria-valuemax"?: number | undefined;
  /** Defines the minimum allowed value for a range widget. */
  "aria-valuemin"?: number | undefined;
  /**
   * Defines the current value for a range widget.
   * @see aria-valuetext.
   */
  "aria-valuenow"?: number | undefined;
  /** Defines the human readable text alternative of aria-valuenow for a range widget. */
  "aria-valuetext"?: string | undefined;
}

// All the WAI-ARIA 1.1 role attribute values from https://www.w3.org/TR/wai-aria-1.1/#role_definitions
type AriaRole =
  | "alert"
  | "alertdialog"
  | "application"
  | "article"
  | "banner"
  | "button"
  | "cell"
  | "checkbox"
  | "columnheader"
  | "combobox"
  | "complementary"
  | "contentinfo"
  | "definition"
  | "dialog"
  | "directory"
  | "document"
  | "feed"
  | "figure"
  | "form"
  | "grid"
  | "gridcell"
  | "group"
  | "heading"
  | "img"
  | "link"
  | "list"
  | "listbox"
  | "listitem"
  | "log"
  | "main"
  | "marquee"
  | "math"
  | "menu"
  | "menubar"
  | "menuitem"
  | "menuitemcheckbox"
  | "menuitemradio"
  | "navigation"
  | "none"
  | "note"
  | "option"
  | "presentation"
  | "progressbar"
  | "radio"
  | "radiogroup"
  | "region"
  | "row"
  | "rowgroup"
  | "rowheader"
  | "scrollbar"
  | "search"
  | "searchbox"
  | "separator"
  | "slider"
  | "spinbutton"
  | "status"
  | "switch"
  | "tab"
  | "table"
  | "tablist"
  | "tabpanel"
  | "term"
  | "textbox"
  | "timer"
  | "toolbar"
  | "tooltip"
  | "tree"
  | "treegrid"
  | "treeitem"
  | (string & NonNullable<unknown>);

type DOMAttributes<T> = SpecialProps & EventHandler<T> & {
  children?: Node | Node[] | undefined;
  innerHTML?: string;
};

type CSSProperties = Properties;

interface SVGAttributes<T> extends AriaAttributes, DOMAttributes<T> {
  // Attributes which are also defined in HTMLAttributes
  class?: ReactiveAttr;
  color?: string | undefined;
  height?: number | string | undefined;
  id?: string | undefined;
  lang?: string | undefined;
  max?: number | string | undefined;
  media?: string | undefined;
  method?: string | undefined;
  min?: number | string | undefined;
  name?: string | undefined;
  style?: CSSProperties | undefined;
  target?: string | undefined;
  type?: string | undefined;
  width?: number | string | undefined;

  // Other HTML properties supported by SVG elements in browsers
  role?: AriaRole | undefined;
  tabindex?: number | undefined;
  crossorigin?: CrossOrigin;

  // SVG Specific attributes
  "accent-height"?: number | string | undefined;
  accumulate?: "none" | "sum" | undefined;
  additive?: "replace" | "sum" | undefined;
  "alignment-baseline"?:
  | "auto"
  | "baseline"
  | "before-edge"
  | "text-before-edge"
  | "middle"
  | "central"
  | "after-edge"
  | "text-after-edge"
  | "ideographic"
  | "alphabetic"
  | "hanging"
  | "mathematical"
  | "inherit"
  | undefined;
  alphabetic?: number | string | undefined;
  amplitude?: number | string | undefined;
  "arabic-form"?: "initial" | "medial" | "terminal" | "isolated" | undefined;
  ascent?: number | string | undefined;
  attributeName?: string | undefined;
  attributeType?: string | undefined;
  azimuth?: number | string | undefined;
  baseFrequency?: number | string | undefined;
  "baseline-shift"?: number | string | undefined;
  baseProfile?: number | string | undefined;
  bbox?: number | string | undefined;
  begin?: number | string | undefined;
  bias?: number | string | undefined;
  by?: number | string | undefined;
  calcMode?: number | string | undefined;
  "cap-height"?: number | string | undefined;
  clip?: number | string | undefined;
  "clip-path"?: string | undefined;
  "clip-rule"?: number | string | undefined;
  "color-interpolation"?: number | string | undefined;
  "color-interpolation-filters"?: "auto" | "sRGB" | "linearRGB" | "inherit" | undefined;
  "color-profile"?: number | string | undefined;
  "color-rendering"?: number | string | undefined;
  "content-script-type"?: number | string | undefined;
  "content-style-type"?: number | string | undefined;
  cursor?: number | string | undefined;
  cx?: number | string | undefined;
  cy?: number | string | undefined;
  d?: string | undefined;
  decelerate?: number | string | undefined;
  descent?: number | string | undefined;
  diffuseConstant?: number | string | undefined;
  direction?: number | string | undefined;
  display?: number | string | undefined;
  divisor?: number | string | undefined;
  "dominant-baseline"?: number | string | undefined;
  dur?: number | string | undefined;
  dx?: number | string | undefined;
  dy?: number | string | undefined;
  edgeMode?: number | string | undefined;
  elevation?: number | string | undefined;
  "enable-background"?: number | string | undefined;
  end?: number | string | undefined;
  exponent?: number | string | undefined;
  "external-resources-required"?: BoolAttr | undefined;
  fill?: string | undefined;
  "fill-opacity"?: number | string | undefined;
  "fill-rule"?: "nonzero" | "evenodd" | "inherit" | undefined;
  filter?: string | undefined;
  "flood-color"?: number | string | undefined;
  "flood-opacity"?: number | string | undefined;
  focusable?: BoolAttr | "auto" | undefined;
  "font-family"?: string | undefined;
  "font-size"?: number | string | undefined;
  "font-size-adjust"?: number | string | undefined;
  "font-stretch"?: number | string | undefined;
  "font-style"?: number | string | undefined;
  "font-variant"?: number | string | undefined;
  "font-weight"?: number | string | undefined;
  format?: number | string | undefined;
  fr?: number | string | undefined;
  from?: number | string | undefined;
  fx?: number | string | undefined;
  fy?: number | string | undefined;
  g1?: number | string | undefined;
  g2?: number | string | undefined;
  "glyph-name"?: number | string | undefined;
  "glyph-orientation-horizontal"?: number | string | undefined;
  "glyph-orientation-vertical"?: number | string | undefined;
  "glyph-ref"?: number | string | undefined;
  gradientTransform?: string | undefined;
  gradientUnits?: string | undefined;
  hanging?: number | string | undefined;
  "horiz-adv-x"?: number | string | undefined;
  "horiz-origin-x"?: number | string | undefined;
  href?: string | undefined;
  ideographic?: number | string | undefined;
  "image-rendering"?: number | string | undefined;
  in2?: number | string | undefined;
  in?: string | undefined;
  intercept?: number | string | undefined;
  k1?: number | string | undefined;
  k2?: number | string | undefined;
  k3?: number | string | undefined;
  k4?: number | string | undefined;
  k?: number | string | undefined;
  kernelMatrix?: number | string | undefined;
  kernelUnitLength?: number | string | undefined;
  kerning?: number | string | undefined;
  keyPoints?: number | string | undefined;
  keySplines?: number | string | undefined;
  keyTimes?: number | string | undefined;
  lengthAdjust?: number | string | undefined;
  "letter-spacing"?: number | string | undefined;
  "lighting-color"?: number | string | undefined;
  limitingConeAngle?: number | string | undefined;
  local?: number | string | undefined;
  "marker-end"?: string | undefined;
  markerHeight?: number | string | undefined;
  "marker-mid"?: string | undefined;
  "marker-start"?: string | undefined;
  markerUnits?: number | string | undefined;
  markerWidth?: number | string | undefined;
  mask?: string | undefined;
  maskContentUnits?: number | string | undefined;
  maskUnits?: number | string | undefined;
  mathematical?: number | string | undefined;
  mode?: number | string | undefined;
  numOctaves?: number | string | undefined;
  offset?: number | string | undefined;
  opacity?: number | string | undefined;
  operator?: number | string | undefined;
  order?: number | string | undefined;
  orient?: number | string | undefined;
  orientation?: number | string | undefined;
  origin?: number | string | undefined;
  overflow?: number | string | undefined;
  "overline-position"?: number | string | undefined;
  "overline-thickness"?: number | string | undefined;
  "paint-order"?: number | string | undefined;
  "panose-1"?: number | string | undefined;
  path?: string | undefined;
  pathLength?: number | string | undefined;
  patternContentUnits?: string | undefined;
  patternTransform?: number | string | undefined;
  patternUnits?: string | undefined;
  "pointer-events"?: number | string | undefined;
  points?: string | undefined;
  pointsAtX?: number | string | undefined;
  pointsAtY?: number | string | undefined;
  pointsAtZ?: number | string | undefined;
  preserveAlpha?: BoolAttr | undefined;
  preserveAspectRatio?: string | undefined;
  primitiveUnits?: number | string | undefined;
  r?: number | string | undefined;
  radius?: number | string | undefined;
  refX?: number | string | undefined;
  refY?: number | string | undefined;
  renderingIntent?: number | string | undefined;
  repeatCount?: number | string | undefined;
  repeatDur?: number | string | undefined;
  requiredExtensions?: number | string | undefined;
  requiredFeatures?: number | string | undefined;
  restart?: number | string | undefined;
  result?: string | undefined;
  rotate?: number | string | undefined;
  rx?: number | string | undefined;
  ry?: number | string | undefined;
  scale?: number | string | undefined;
  seed?: number | string | undefined;
  "shape-rendering"?: number | string | undefined;
  slope?: number | string | undefined;
  spacing?: number | string | undefined;
  specularConstant?: number | string | undefined;
  specularExponent?: number | string | undefined;
  speed?: number | string | undefined;
  spreadMethod?: string | undefined;
  startOffset?: number | string | undefined;
  stdDeviation?: number | string | undefined;
  stemh?: number | string | undefined;
  stemv?: number | string | undefined;
  stitchTiles?: number | string | undefined;
  "stop-color"?: string | undefined;
  "stop-opacity"?: number | string | undefined;
  "strikethrough-position"?: number | string | undefined;
  "strikethrough-thickness"?: number | string | undefined;
  string?: number | string | undefined;
  stroke?: string | undefined;
  "stroke-dasharray"?: string | number | undefined;
  "stroke-dashoffset"?: string | number | undefined;
  "stroke-linecap"?: "butt" | "round" | "square" | "inherit" | undefined;
  "stroke-linejoin"?: "miter" | "round" | "bevel" | "inherit" | undefined;
  "stroke-miterlimit"?: number | string | undefined;
  "stroke-opacity"?: number | string | undefined;
  "stroke-width"?: number | string | undefined;
  surfaceScale?: number | string | undefined;
  systemLanguage?: number | string | undefined;
  tableValues?: number | string | undefined;
  targetX?: number | string | undefined;
  targetY?: number | string | undefined;
  "text-anchor"?: string | undefined;
  "text-decoration"?: number | string | undefined;
  "text-length"?: number | string | undefined;
  "text-rendering"?: number | string | undefined;
  to?: number | string | undefined;
  transform?: string | undefined;
  u1?: number | string | undefined;
  u2?: number | string | undefined;
  "underline-position"?: number | string | undefined;
  "underline-thickness"?: number | string | undefined;
  unicode?: number | string | undefined;
  "unicode-bidi"?: number | string | undefined;
  "unicode-range"?: number | string | undefined;
  "units-per-em"?: number | string | undefined;
  "v-alphabetic"?: number | string | undefined;
  values?: string | undefined;
  "vector-effect"?: number | string | undefined;
  version?: string | undefined;
  "vert-adv-y"?: number | string | undefined;
  "vert-origin-x"?: number | string | undefined;
  "vert-origin-y"?: number | string | undefined;
  "v-hanging"?: number | string | undefined;
  "v-ideographic"?: number | string | undefined;
  viewBox?: string | undefined;
  viewTarget?: number | string | undefined;
  visibility?: number | string | undefined;
  "v-mathematical"?: number | string | undefined;
  widths?: number | string | undefined;
  "word-spacing"?: number | string | undefined;
  "writing-mode"?: number | string | undefined;
  x1?: number | string | undefined;
  x2?: number | string | undefined;
  x?: number | string | undefined;
  xChannelSelector?: string | undefined;
  "x-height"?: number | string | undefined;
  "xlink:actuate"?: string | undefined;
  "xlink:arcrole"?: string | undefined;
  "xlink:href"?: string | undefined;
  "xlink:role"?: string | undefined;
  "xlink:show"?: string | undefined;
  "xlink:title"?: string | undefined;
  "xlink:type"?: string | undefined;
  "xml:base"?: string | undefined;
  "xml:lang"?: string | undefined;
  xmlns?: string | undefined;
  "xmlns-xlink"?: string | undefined;
  "xml-space"?: string | undefined;
  y1?: number | string | undefined;
  y2?: number | string | undefined;
  y?: number | string | undefined;
  yChannelSelector?: string | undefined;
  z?: number | string | undefined;
  zoomAndPan?: string | undefined;
}

export interface HTMLAttributes<T> extends AriaAttributes, Partial<DOMAttributes<T>> {
  ref?: { value: T | null },
  // Standard HTML Attributes
  accesskey?: string | undefined;
  autofocus?: boolean | undefined;
  class?: ReactiveAttr;
  contenteditable?: BoolAttr | "inherit" | "plaintext-only" | undefined;
  contextMenu?: string | undefined;
  dir?: string | undefined;
  draggable?: BoolAttr | undefined;
  hidden?: boolean | undefined;
  id?: string | undefined;
  lang?: string | undefined;
  nonce?: string | undefined;
  slot?: string | undefined;
  spellcheck?: BoolAttr | undefined;
  style?: CSSProperties | undefined;
  tabindex?: number | undefined;
  title?: string | undefined;
  translate?: "yes" | "no" | undefined;

  // Unknown
  radiogroup?: string | undefined; // <command>, <menuitem>

  // WAI-ARIA
  role?: AriaRole | undefined;

  // RDFa Attributes
  about?: string | undefined;
  content?: string | undefined;
  datatype?: string | undefined;
  inlist?: any;
  prefix?: string | undefined;
  property?: string | undefined;
  rel?: string | undefined;
  resource?: string | undefined;
  rev?: string | undefined;
  typeof?: string | undefined;
  vocab?: string | undefined;

  // Non-standard Attributes
  autocapitalize?: string | undefined;
  autocorrect?: string | undefined;
  autosave?: string | undefined;
  color?: string | undefined;
  itemprop?: string | undefined;
  itemscope?: boolean | undefined;
  itemtype?: string | undefined;
  itemid?: string | undefined;
  itemref?: string | undefined;
  results?: number | undefined;
  security?: string | undefined;
  unselectable?: "on" | "off" | undefined;

  // Living Standard
  /**
   * Hints at the type of data that might be entered by the user while editing the element or its contents
   * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute}
   */
  inputmode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search" | undefined;
  /**
   * Specify that a standard HTML element should behave like a defined custom built-in element
   * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is}
   */
  is?: string | undefined;
}

export type HTMLElementAttributeMap = {
  a: Binders<AnchorHTMLAttributes<HTMLAnchorElement>>;
  abbr: Binders<HTMLAttributes<HTMLElement>>;
  address: Binders<HTMLAttributes<HTMLElement>>;
  area: Binders<AreaHTMLAttributes<HTMLAreaElement>>;
  article: Binders<HTMLAttributes<HTMLElement>>;
  aside: Binders<HTMLAttributes<HTMLElement>>;
  audio: Binders<AudioHTMLAttributes<HTMLAudioElement>>;
  b: Binders<HTMLAttributes<HTMLElement>>;
  base: Binders<BaseHTMLAttributes<HTMLBaseElement>>;
  bdi: Binders<HTMLAttributes<HTMLElement>>;
  bdo: Binders<HTMLAttributes<HTMLElement>>;
  big: Binders<HTMLAttributes<HTMLElement>>;
  blockquote: Binders<BlockquoteHTMLAttributes<HTMLQuoteElement>>;
  body: Binders<HTMLAttributes<HTMLBodyElement>>;
  br: Binders<HTMLAttributes<HTMLBRElement>>;
  button: Binders<ButtonHTMLAttributes<HTMLButtonElement>>;
  canvas: Binders<CanvasHTMLAttributes<HTMLCanvasElement>>;
  caption: Binders<HTMLAttributes<HTMLElement>>;
  center: Binders<HTMLAttributes<HTMLElement>>;
  cite: Binders<HTMLAttributes<HTMLElement>>;
  code: Binders<HTMLAttributes<HTMLElement>>;
  col: Binders<ColHTMLAttributes<HTMLTableColElement>>;
  colgroup: Binders<ColgroupHTMLAttributes<HTMLTableColElement>>;
  data: Binders<DataHTMLAttributes<HTMLDataElement>>;
  datalist: Binders<HTMLAttributes<HTMLDataListElement>>;
  dd: Binders<HTMLAttributes<HTMLElement>>;
  del: Binders<DelHTMLAttributes<HTMLModElement>>;
  details: Binders<DetailsHTMLAttributes<HTMLDetailsElement>>;
  dfn: Binders<HTMLAttributes<HTMLElement>>;
  dialog: Binders<DialogHTMLAttributes<HTMLDialogElement>>;
  div: Binders<HTMLAttributes<HTMLDivElement>>;
  dl: Binders<HTMLAttributes<HTMLDListElement>>;
  dt: Binders<HTMLAttributes<HTMLElement>>;
  em: Binders<HTMLAttributes<HTMLElement>>;
  embed: Binders<EmbedHTMLAttributes<HTMLEmbedElement>>;
  fieldset: Binders<FieldsetHTMLAttributes<HTMLFieldSetElement>>;
  figcaption: Binders<HTMLAttributes<HTMLElement>>;
  figure: Binders<HTMLAttributes<HTMLElement>>;
  footer: Binders<HTMLAttributes<HTMLElement>>;
  form: Binders<FormHTMLAttributes<HTMLFormElement>>;
  h1: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h2: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h3: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h4: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h5: Binders<HTMLAttributes<HTMLHeadingElement>>;
  h6: Binders<HTMLAttributes<HTMLHeadingElement>>;
  head: Binders<HTMLAttributes<HTMLElement>>;
  header: Binders<HTMLAttributes<HTMLElement>>;
  hgroup: Binders<HTMLAttributes<HTMLElement>>;
  hr: Binders<HTMLAttributes<HTMLHRElement>>;
  html: Binders<HtmlHTMLAttributes<HTMLHtmlElement>>;
  i: Binders<HTMLAttributes<HTMLElement>>;
  iframe: Binders<IframeHTMLAttributes<HTMLIFrameElement>>;
  img: Binders<ImgHTMLAttributes<HTMLImageElement>>;
  input: Binders<InputHTMLAttributes<HTMLInputElement>>;
  ins: Binders<InsHTMLAttributes<HTMLModElement>>;
  kbd: Binders<HTMLAttributes<HTMLElement>>;
  keygen: Binders<KeygenHTMLAttributes<HTMLElement>>;
  label: Binders<LabelHTMLAttributes<HTMLLabelElement>>;
  legend: Binders<HTMLAttributes<HTMLLegendElement>>;
  li: Binders<LiHTMLAttributes<HTMLLIElement>>;
  link: Binders<LinkHTMLAttributes<HTMLLinkElement>>;
  main: Binders<HTMLAttributes<HTMLElement>>;
  map: Binders<MapHTMLAttributes<HTMLMapElement>>;
  mark: Binders<HTMLAttributes<HTMLElement>>;
  menu: Binders<MenuHTMLAttributes<HTMLElement>>;
  menuitem: Binders<HTMLAttributes<HTMLElement>>;
  meta: Binders<MetaHTMLAttributes<HTMLMetaElement>>;
  meter: Binders<MeterHTMLAttributes<HTMLMeterElement>>;
  nav: Binders<HTMLAttributes<HTMLElement>>;
  noscript: Binders<HTMLAttributes<HTMLElement>>;
  object: Binders<ObjectHTMLAttributes<HTMLObjectElement>>;
  ol: Binders<OlHTMLAttributes<HTMLOListElement>>;
  optgroup: Binders<OptgroupHTMLAttributes<HTMLOptGroupElement>>;
  option: Binders<OptionHTMLAttributes<HTMLOptionElement>>;
  output: Binders<OutputHTMLAttributes<HTMLOutputElement>>;
  p: Binders<HTMLAttributes<HTMLParagraphElement>>;
  picture: Binders<HTMLAttributes<HTMLElement>>;
  pre: Binders<HTMLAttributes<HTMLPreElement>>;
  progress: Binders<ProgressHTMLAttributes<HTMLProgressElement>>;
  q: Binders<QuoteHTMLAttributes<HTMLQuoteElement>>;
  rp: Binders<HTMLAttributes<HTMLElement>>;
  rt: Binders<HTMLAttributes<HTMLElement>>;
  ruby: Binders<HTMLAttributes<HTMLElement>>;
  s: Binders<HTMLAttributes<HTMLElement>>;
  samp: Binders<HTMLAttributes<HTMLElement>>;
  search: Binders<HTMLAttributes<HTMLElement>>;
  slot: Binders<SlotHTMLAttributes<HTMLSlotElement>>;
  script: Binders<ScriptHTMLAttributes<HTMLScriptElement>>;
  section: Binders<HTMLAttributes<HTMLElement>>;
  select: Binders<SelectHTMLAttributes<HTMLSelectElement>>;
  small: Binders<HTMLAttributes<HTMLElement>>;
  source: Binders<SourceHTMLAttributes<HTMLSourceElement>>;
  span: Binders<HTMLAttributes<HTMLSpanElement>>;
  strong: Binders<HTMLAttributes<HTMLElement>>;
  style: Binders<StyleHTMLAttributes<HTMLStyleElement>>;
  sub: Binders<HTMLAttributes<HTMLElement>>;
  summary: Binders<HTMLAttributes<HTMLElement>>;
  sup: Binders<HTMLAttributes<HTMLElement>>;
  table: Binders<TableHTMLAttributes<HTMLTableElement>>;
  template: Binders<HTMLAttributes<HTMLTemplateElement>>;
  tbody: Binders<HTMLAttributes<HTMLTableSectionElement>>;
  textarea: Binders<TextareaHTMLAttributes<HTMLTextAreaElement>>;
  tfoot: Binders<HTMLAttributes<HTMLTableSectionElement>>;
  thead: Binders<HTMLAttributes<HTMLTableSectionElement>>;
  time: Binders<TimeHTMLAttributes<HTMLTimeElement>>;
  title: Binders<HTMLAttributes<HTMLTitleElement>>;
  tr: Binders<HTMLAttributes<HTMLTableRowElement>>;
  track: Binders<TrackHTMLAttributes<HTMLTrackElement>>;
  u: Binders<HTMLAttributes<HTMLElement>>;
  ul: Binders<HTMLAttributes<HTMLUListElement>>;
  var: Binders<HTMLAttributes<HTMLElement>>;
  video: Binders<VideoHTMLAttributes<HTMLVideoElement>>;
  wbr: Binders<HTMLAttributes<HTMLElement>>;
};
