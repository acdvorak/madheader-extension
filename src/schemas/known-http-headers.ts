import z from 'zod';

export const KnownHttpRequestHeaderName = z.enum([
  'Authorization',
  'Proxy-Authorization',
  'Cache-Control',
  'If-Match',
  'If-None-Match',
  'If-Modified-Since',
  'If-Unmodified-Since',
  'Connection',
  'Keep-Alive',
  'Accept',
  'Accept-Encoding',
  'Accept-Language',
  'Expect',
  'Max-Forwards',
  'Cookie',
  'Access-Control-Request-Headers',
  'Access-Control-Request-Method',
  'Origin',
  'Content-Digest',
  'Repr-Digest',
  'Want-Content-Digest',
  'Want-Repr-Digest',
  'Content-Length',
  'Content-Type',
  'Content-Encoding',
  'Content-Language',
  'Content-Location',
  'Prefer',
  'Forwarded',
  'Via',
  'Range',
  'If-Range',
  'From',
  'Host',
  'Referer',
  'User-Agent',
  'Upgrade-Insecure-Requests',
  'Sec-Fetch-Site',
  'Sec-Fetch-Mode',
  'Sec-Fetch-User',
  'Sec-Fetch-Dest',
  'Sec-Purpose',
  'Service-Worker-Navigation-Preload',
  'Sec-Fetch-Storage-Access',
  'Transfer-Encoding',
  'TE',
  'Trailer',
  'Sec-WebSocket-Extensions',
  'Sec-WebSocket-Key',
  'Sec-WebSocket-Protocol',
  'Sec-WebSocket-Version',
  'Alt-Used',
  'Date',
  'Link',
  'Service-Worker',
  'Upgrade',
  'Priority',
  'Attribution-Reporting-Eligible',
  'Sec-CH-UA',
  'Sec-CH-UA-Arch',
  'Sec-CH-UA-Bitness',
  'Sec-CH-UA-Form-Factors',
  'Sec-CH-UA-Full-Version',
  'Sec-CH-UA-Full-Version-List',
  'Sec-CH-UA-Mobile',
  'Sec-CH-UA-Model',
  'Sec-CH-UA-Platform',
  'Sec-CH-UA-Platform-Version',
  'Sec-CH-UA-WoW64',
  'Sec-CH-Prefers-Color-Scheme',
  'Sec-CH-Prefers-Reduced-Motion',
  'Sec-CH-Prefers-Reduced-Transparency',
  'Sec-CH-Device-Memory',
  'Sec-CH-DPR',
  'Sec-CH-Viewport-Height',
  'Sec-CH-Viewport-Width',
  'Sec-CH-Width',
  'Device-Memory',
  'DPR',
  'Viewport-Width',
  'Width',
  'Downlink',
  'ECT',
  'RTT',
  'Save-Data',
  'Available-Dictionary',
  'Dictionary-ID',
  'DNT',
  'Sec-GPC',
  'Sec-Browsing-Topics',
  'Accept-Signature',
  'Early-Data',
  'Idempotency-Key',
  'Sec-Speculation-Tags',
  'X-Forwarded-For',
  'X-Forwarded-Host',
  'X-Forwarded-Proto',
  'Pragma',
]);
export type KnownHttpRequestHeaderName = z.infer<
  typeof KnownHttpRequestHeaderName
>;

export const KnownHttpResponseHeaderName = z.enum([
  'WWW-Authenticate',
  'Proxy-Authenticate',
  'Age',
  'Cache-Control',
  'Clear-Site-Data',
  'Expires',
  'No-Vary-Search',
  'Last-Modified',
  'ETag',
  'Vary',
  'Connection',
  'Keep-Alive',
  'Accept-Encoding',
  'Accept-Patch',
  'Accept-Post',
  'Set-Cookie',
  'Access-Control-Allow-Credentials',
  'Access-Control-Allow-Headers',
  'Access-Control-Allow-Methods',
  'Access-Control-Allow-Origin',
  'Access-Control-Expose-Headers',
  'Access-Control-Max-Age',
  'Timing-Allow-Origin',
  'Content-Disposition',
  'Content-Digest',
  'Repr-Digest',
  'Want-Content-Digest',
  'Want-Repr-Digest',
  'Integrity-Policy',
  'Integrity-Policy-Report-Only',
  'Content-Length',
  'Content-Type',
  'Content-Encoding',
  'Content-Language',
  'Content-Location',
  'Preference-Applied',
  'Via',
  'Accept-Ranges',
  'Content-Range',
  'Location',
  'Refresh',
  'Referrer-Policy',
  'Allow',
  'Server',
  'Cross-Origin-Embedder-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
  'Content-Security-Policy',
  'Content-Security-Policy-Report-Only',
  'Expect-CT',
  'Permissions-Policy',
  'Reporting-Endpoints',
  'Strict-Transport-Security',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'X-Permitted-Cross-Domain-Policies',
  'X-Powered-By',
  'X-XSS-Protection',
  'Activate-Storage-Access',
  'Report-To',
  'Transfer-Encoding',
  'Trailer',
  'Sec-WebSocket-Accept',
  'Sec-WebSocket-Extensions',
  'Sec-WebSocket-Protocol',
  'Sec-WebSocket-Version',
  'Alt-Svc',
  'Date',
  'Link',
  'Retry-After',
  'Server-Timing',
  'Service-Worker-Allowed',
  'SourceMap',
  'Upgrade',
  'Priority',
  'Attribution-Reporting-Register-Source',
  'Attribution-Reporting-Register-Trigger',
  'Accept-CH',
  'Critical-CH',
  'Use-As-Dictionary',
  'Tk',
  'Origin-Agent-Cluster',
  'NEL',
  'Observe-Browsing-Topics',
  'Set-Login',
  'Signature',
  'Signed-Headers',
  'Speculation-Rules',
  'Supports-Loading-Mode',
  'X-DNS-Prefetch-Control',
  'X-Robots-Tag',
  'Pragma',
  'Warning',
]);
export type KnownHttpResponseHeaderName = z.infer<
  typeof KnownHttpResponseHeaderName
>;

////////////////////////////////////////////////////////////////////////////////
// Header value validators
////////////////////////////////////////////////////////////////////////////////

function isHttpFieldValue(value: string): boolean {
  for (const character of value) {
    const codePoint = character.codePointAt(0);
    if (
      codePoint === undefined ||
      (codePoint !== 0x09 &&
        (codePoint < 0x20 || codePoint === 0x7f || codePoint > 0xff))
    ) {
      return false;
    }
  }
  return true;
}

const HttpFieldValue = z.string().refine(isHttpFieldValue, {
  error: 'Must contain only characters permitted in an HTTP field value.',
});

function matchingHttpFieldValue(
  pattern: RegExp,
  error: string,
): z.ZodType<string> {
  return HttpFieldValue.refine((value) => pattern.test(value), { error });
}

const NonNegativeInteger = matchingHttpFieldValue(
  /^(?:0|[1-9]\d*)$/,
  'Must be a non-negative decimal integer.',
);
const NonNegativeDecimal = matchingHttpFieldValue(
  /^(?:0|[1-9]\d*)(?:\.\d+)?$/,
  'Must be a non-negative decimal number.',
);
const HttpDate = matchingHttpFieldValue(
  /^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} \d{2}:\d{2}:\d{2} GMT$/,
  'Must be an IMF-fixdate HTTP date.',
);
const HttpToken = matchingHttpFieldValue(
  /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/,
  'Must be a valid HTTP token.',
);
const HttpTokenList = matchingHttpFieldValue(
  /^\s*[!#$%&'*+.^_`|~0-9A-Za-z-]+(?:\s*,\s*[!#$%&'*+.^_`|~0-9A-Za-z-]+)*\s*$/,
  'Must be a comma-separated list of HTTP tokens.',
);
const MediaType = z.union([
  z.literal([
    // Text files
    'application/json',
    'text/html; charset=utf-8',
    'text/css; charset=utf-8',
    'text/javascript; charset=utf-8',
    'text/plain; charset=utf-8',

    // Images
    'image/svg+xml',
    'image/png',
    'image/apng',
    'image/webp',
    'image/jpeg',
    'image/avif',
    'image/gif',

    // Binary files
    'application/pdf',
    'application/octet-stream',
  ]),
  matchingHttpFieldValue(
    /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+(?:\s*;\s*[!#$%&'*+.^_`|~0-9A-Za-z-]+=(?:[!#$%&'*+.^_`|~0-9A-Za-z-]+|"[^"\r\n]*"))*$/,
    'Must be a valid HTTP media type with optional parameters.',
  ),
]);
const MediaTypeList = matchingHttpFieldValue(
  /^(?:[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+)(?:\s*,\s*[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+)*$/,
  'Must be a comma-separated list of HTTP media types.',
);
const EntityTag = matchingHttpFieldValue(
  /^(?:W\/)?"[\x21\x23-\x7e\x80-\xff]*"$/,
  'Must be a valid strong or weak HTTP entity tag.',
);
const EntityTagList = matchingHttpFieldValue(
  /^(?:\*|(?:W\/)?"[\x21\x23-\x7e\x80-\xff]*"(?:\s*,\s*(?:W\/)?"[\x21\x23-\x7e\x80-\xff]*")*)$/,
  'Must be "*" or a comma-separated list of HTTP entity tags.',
);
const HttpOrigin = HttpFieldValue.refine(
  (value) => {
    if (value === 'null') {
      return true;
    }
    try {
      const url = new URL(value);
      return value === url.origin && ['http:', 'https:'].includes(url.protocol);
    } catch {
      return false;
    }
  },
  {
    error: 'Must be "null" or an HTTP(S) origin without a path.',
  },
);
const JsonText = HttpFieldValue.refine(
  (value) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  {
    error: 'Must contain valid JSON text.',
  },
);
const RangeValue = matchingHttpFieldValue(
  /^[A-Za-z]+=(?:\d*-\d*)(?:\s*,\s*\d*-\d*)*$/,
  'Must contain a range unit and one or more ranges.',
);
const HostValue = matchingHttpFieldValue(
  /^(?:\[[0-9A-Fa-f:.]+\]|[^\s/:]+)(?::\d{1,5})?$/,
  'Must be a host name or IP address with an optional port.',
);
const StrictTransportSecurity = matchingHttpFieldValue(
  /^max-age=(?:0|[1-9]\d*)(?:\s*;\s*includeSubDomains)?(?:\s*;\s*preload)?$/i,
  'Must specify max-age and may include includeSubDomains and preload.',
);
const RetryAfter = HttpFieldValue.refine(
  (value) =>
    NonNegativeInteger.safeParse(value).success ||
    HttpDate.safeParse(value).success,
  { error: 'Must be a delay in seconds or an IMF-fixdate HTTP date.' },
);

type HeaderDefinition =
  | readonly [description: string]
  | readonly [description: string, schema: z.ZodType<string>, example: string];

function header(description: string): HeaderDefinition {
  return [description];
}

function formattedHeader(
  description: string,
  schema: z.ZodType<string>,
  example: string,
): HeaderDefinition {
  return [description, schema, example];
}

type HeaderShape<Definitions extends Record<string, HeaderDefinition>> = {
  [Name in keyof Definitions]: z.ZodOptional<z.ZodType<string>>;
};

function buildHeaderShape<
  const Definitions extends Record<string, HeaderDefinition>,
>(definitions: Definitions): HeaderShape<Definitions> {
  return Object.fromEntries(
    Object.entries(definitions).map(([name, definition]) => {
      const [description, schema = HttpFieldValue, example] = definition;
      const mdLines: string[] = [description];
      const textLines: string[] = [description];
      if (example) {
        mdLines.push(`Example: \`${example}\`.`);
        textLines.push(`Example: ${JSON.stringify(example)}.`);
      }
      mdLines.push(
        `See [\`${name}\` on MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/${name}).`,
      );
      textLines.push(
        `See https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/${name}`,
      );
      return [
        name,
        schema.meta({
          description: textLines.join('\n\n'),
          markdownDescription: mdLines.join('\n\n'),
        } satisfies {
          /** Standard plain-text description field, supported everywhere. */
          description?: string;
          /** Non-standard JSON Schema extension, supported by Monaco. */
          markdownDescription?: string;
        }),
      ];
    }),
  ) as HeaderShape<Definitions>;
}

////////////////////////////////////////////////////////////////////////////////
// Request headers
////////////////////////////////////////////////////////////////////////////////

const KnownHttpRequestHeaderDefinitions = {
  'Authorization': header(
    'Contains the credentials to authenticate a user agent with a server.',
  ),
  'Proxy-Authorization': header(
    'Contains the credentials to authenticate a user agent with a proxy server.',
  ),
  'Cache-Control': header(
    'Directives for caching mechanisms in both requests and responses.',
  ),
  'If-Match': formattedHeader(
    'Makes the request conditional and applies the method ' +
      'only if the resource matches one of the given entity tags.',
    EntityTagList,
    '"67ab43"',
  ),
  'If-None-Match': formattedHeader(
    'Makes the request conditional and applies the method ' +
      'only if the resource does not match any given entity tag.',
    EntityTagList,
    '*',
  ),
  'If-Modified-Since': formattedHeader(
    'Transfers the resource only if it was modified after the given date.',
    HttpDate,
    'Wed, 21 Oct 2015 07:28:00 GMT',
  ),
  'If-Unmodified-Since': formattedHeader(
    'Transfers the resource only if it was not modified after the given date.',
    HttpDate,
    'Wed, 21 Oct 2015 07:28:00 GMT',
  ),
  'Connection': formattedHeader(
    'Controls whether the network connection stays open ' +
      'after the current transaction finishes.',
    HttpTokenList,
    'keep-alive',
  ),
  'Keep-Alive': header(
    'Controls how long a persistent connection should stay open.',
  ),
  'Accept': header(
    'Informs the server about the media types of data that can be sent back.',
  ),
  'Accept-Encoding': header(
    'Lists the content encodings the client can understand.',
  ),
  'Accept-Language': header(
    'Informs the server about the human languages the client prefers.',
  ),
  'Expect': header(
    'Indicates expectations that the server needs to fulfill ' +
      'to handle the request.',
  ),
  'Max-Forwards': formattedHeader(
    'Indicates the maximum number of hops a TRACE or OPTIONS request may make.',
    NonNegativeInteger,
    '10',
  ),
  'Cookie': header(
    'Contains stored HTTP cookies previously sent by the server.',
  ),
  'Access-Control-Request-Headers': formattedHeader(
    'Tells the server which HTTP headers will be used by the actual CORS request.',
    HttpTokenList,
    'Content-Type, X-PINGOTHER',
  ),
  'Access-Control-Request-Method': formattedHeader(
    'Tells the server which HTTP method will be used by the actual CORS request.',
    HttpToken,
    'POST',
  ),
  'Origin': formattedHeader(
    'Indicates the origin that caused the request.',
    HttpOrigin,
    'https://developer.mozilla.org',
  ),
  'Content-Digest': header(
    'Provides a digest of the content of an HTTP message.',
  ),
  'Repr-Digest': header(
    'Provides a digest of the selected representation before transmission.',
  ),
  'Want-Content-Digest': header(
    'States the preference for receiving a Content-Digest header.',
  ),
  'Want-Repr-Digest': header(
    'States the preference for receiving a Repr-Digest header.',
  ),
  'Content-Length': formattedHeader(
    'The size of the message content in decimal bytes.',
    NonNegativeInteger,
    '3495',
  ),
  'Content-Type': formattedHeader(
    'Indicates the media type of the message content.',
    MediaType,
    'text/html; charset=utf-8',
  ),
  'Content-Encoding': formattedHeader(
    'Specifies the encodings applied to the message content.',
    HttpTokenList,
    'gzip, br',
  ),
  'Content-Language': header(
    'Describes the human languages intended for the audience.',
  ),
  'Content-Location': header(
    'Indicates an alternate location for the transferred representation.',
  ),
  'Prefer': header(
    'Indicates preferences for specific server behaviors during request processing.',
  ),
  'Forwarded': header(
    'Contains client-facing proxy information that may be altered or lost by a proxy.',
  ),
  'Via': header(
    'Identifies intermediate protocols and recipients between the user agent and server.',
  ),
  'Range': formattedHeader(
    'Indicates the part of a representation that the server should return.',
    RangeValue,
    'bytes=200-1000, 2000-6576',
  ),
  'If-Range': header(
    'Makes a range request conditional on the resource matching an entity tag or date.',
  ),
  'From': formattedHeader(
    'Contains an Internet email address for the human user controlling the user agent.',
    z.email(),
    'webmaster@example.org',
  ),
  'Host': formattedHeader(
    'Specifies the server domain name and optional TCP port.',
    HostValue,
    'developer.mozilla.org:443',
  ),
  'Referer': header(
    'Contains the address from which the requested resource was linked.',
  ),
  'User-Agent': header(
    'Identifies the requesting user agent, operating system, vendor, and version.',
  ),
  'Upgrade-Insecure-Requests': formattedHeader(
    'Signals a preference for an encrypted and authenticated response.',
    z.literal('1'),
    '1',
  ),
  'Sec-Fetch-Site': formattedHeader(
    "Indicates the relationship between the request initiator's origin and target origin.",
    z.enum(['cross-site', 'same-origin', 'same-site', 'none']),
    'same-origin',
  ),
  'Sec-Fetch-Mode': formattedHeader(
    "Indicates the request's mode to the server.",
    z.enum(['cors', 'navigate', 'no-cors', 'same-origin', 'websocket']),
    'cors',
  ),
  'Sec-Fetch-User': formattedHeader(
    'Indicates whether a navigation request was triggered by user activation.',
    z.enum(['?0', '?1']),
    '?1',
  ),
  'Sec-Fetch-Dest': formattedHeader(
    "Indicates the request's destination.",
    z.enum([
      'audio',
      'audioworklet',
      'document',
      'embed',
      'empty',
      'font',
      'frame',
      'iframe',
      'image',
      'manifest',
      'object',
      'paintworklet',
      'report',
      'script',
      'serviceworker',
      'sharedworker',
      'style',
      'track',
      'video',
      'webidentity',
      'worker',
      'xslt',
    ]),
    'document',
  ),
  'Sec-Purpose': formattedHeader(
    'Indicates a request purpose other than immediate use by the user agent.',
    z.literal('prefetch'),
    'prefetch',
  ),
  'Service-Worker-Navigation-Preload': header(
    'Distinguishes a navigation preload request made while a service worker starts.',
  ),
  'Sec-Fetch-Storage-Access': formattedHeader(
    'Indicates the storage access status for the current fetch context.',
    z.enum(['none', 'inactive', 'active']),
    'active',
  ),
  'Transfer-Encoding': formattedHeader(
    'Specifies the transfer coding used to safely transfer the message content.',
    HttpTokenList,
    'chunked',
  ),
  'TE': header(
    'Specifies the transfer codings the user agent is willing to accept.',
  ),
  'Trailer': formattedHeader(
    'Lists fields included in the trailer section of a chunked message.',
    HttpTokenList,
    'Content-MD5',
  ),
  'Sec-WebSocket-Extensions': header(
    'Lists WebSocket extensions supported by the client in preferred order.',
  ),
  'Sec-WebSocket-Key': formattedHeader(
    'Contains a Base64-encoded nonce proving intent to open a WebSocket.',
    z.base64(),
    'dGhlIHNhbXBsZSBub25jZQ==',
  ),
  'Sec-WebSocket-Protocol': formattedHeader(
    'Lists WebSocket subprotocols supported by the client.',
    HttpTokenList,
    'chat, superchat',
  ),
  'Sec-WebSocket-Version': formattedHeader(
    'Indicates the WebSocket protocol version used by the client.',
    NonNegativeInteger,
    '13',
  ),
  'Alt-Used': header(
    'Identifies the alternative service used for the request.',
  ),
  'Date': formattedHeader(
    'Contains the date and time at which the message originated.',
    HttpDate,
    'Wed, 21 Oct 2015 07:28:00 GMT',
  ),
  'Link': header('Serializes one or more links in an HTTP header.'),
  'Service-Worker': formattedHeader(
    'Identifies a fetch for a service worker script resource.',
    z.literal('script'),
    'script',
  ),
  'Upgrade': header(
    'Lists protocols to which the sender wants to upgrade the connection.',
  ),
  'Priority': header(
    'Provides a hint about the priority of a resource request.',
  ),
  'Attribution-Reporting-Eligible': header(
    'Indicates that the response is eligible to register an attribution source or trigger.',
  ),
  'Sec-CH-UA': header(
    "Provides the user agent's branding and significant version.",
  ),
  'Sec-CH-UA-Arch': header(
    "Provides the user agent's underlying platform architecture.",
  ),
  'Sec-CH-UA-Bitness': header(
    "Provides the user agent's CPU architecture bitness.",
  ),
  'Sec-CH-UA-Form-Factors': header("Provides the user agent's form factors."),
  'Sec-CH-UA-Full-Version': header(
    "Provides the user agent's full version string.",
  ),
  'Sec-CH-UA-Full-Version-List': header(
    'Provides the full version for each user agent brand.',
  ),
  'Sec-CH-UA-Mobile': formattedHeader(
    'Indicates whether the user agent prefers a mobile experience.',
    z.enum(['?0', '?1']),
    '?0',
  ),
  'Sec-CH-UA-Model': header("Provides the user agent's device model."),
  'Sec-CH-UA-Platform': header(
    "Provides the user agent's operating system or platform.",
  ),
  'Sec-CH-UA-Platform-Version': header(
    "Provides the user agent's operating system version.",
  ),
  'Sec-CH-UA-WoW64': formattedHeader(
    'Indicates whether a 32-bit user agent runs on 64-bit Windows.',
    z.enum(['?0', '?1']),
    '?1',
  ),
  'Sec-CH-Prefers-Color-Scheme': formattedHeader(
    "Provides the user's preferred color scheme.",
    z.enum(['dark', 'light']),
    'dark',
  ),
  'Sec-CH-Prefers-Reduced-Motion': formattedHeader(
    "Provides the user's reduced-motion preference.",
    z.enum(['no-preference', 'reduce']),
    'reduce',
  ),
  'Sec-CH-Prefers-Reduced-Transparency': formattedHeader(
    "Provides the user's reduced-transparency preference.",
    z.enum(['no-preference', 'reduce']),
    'reduce',
  ),
  'Sec-CH-Device-Memory': formattedHeader(
    'Provides approximate available client RAM in GiB.',
    NonNegativeDecimal,
    '8',
  ),
  'Sec-CH-DPR': formattedHeader(
    'Provides the client device pixel ratio.',
    NonNegativeDecimal,
    '2',
  ),
  'Sec-CH-Viewport-Height': formattedHeader(
    "Provides the client's viewport height in CSS pixels.",
    NonNegativeInteger,
    '900',
  ),
  'Sec-CH-Viewport-Width': formattedHeader(
    "Provides the client's viewport width in CSS pixels.",
    NonNegativeInteger,
    '1280',
  ),
  'Sec-CH-Width': formattedHeader(
    "Provides the requested image's width in CSS pixels.",
    NonNegativeInteger,
    '640',
  ),
  'Device-Memory': formattedHeader(
    'Deprecated client hint for approximate available RAM.',
    NonNegativeDecimal,
    '8',
  ),
  'DPR': formattedHeader(
    'Deprecated client hint for device pixel ratio.',
    NonNegativeDecimal,
    '2',
  ),
  'Viewport-Width': formattedHeader(
    'Deprecated client hint for viewport width.',
    NonNegativeInteger,
    '1280',
  ),
  'Width': formattedHeader(
    'Deprecated client hint for image width.',
    NonNegativeInteger,
    '640',
  ),
  'Downlink': formattedHeader(
    'Provides approximate connection bandwidth in Mbps.',
    NonNegativeDecimal,
    '5.5',
  ),
  'ECT': formattedHeader(
    'Provides the effective connection type.',
    z.enum(['slow-2g', '2g', '3g', '4g']),
    '4g',
  ),
  'RTT': formattedHeader(
    'Provides application-layer round trip time in milliseconds.',
    NonNegativeInteger,
    '125',
  ),
  'Save-Data': formattedHeader(
    'Indicates a preference for reduced data usage.',
    z.literal('on'),
    'on',
  ),
  'Available-Dictionary': header(
    'Identifies the best compression dictionary the browser has available.',
  ),
  'Dictionary-ID': header(
    'Identifies a server-provided compression dictionary available to the browser.',
  ),
  'DNT': formattedHeader(
    "Indicates the user's deprecated Do Not Track preference.",
    z.enum(['0', '1', 'null']),
    '1',
  ),
  'Sec-GPC': formattedHeader(
    'Indicates whether the user consents to selling or sharing personal information.',
    z.literal('1'),
    '1',
  ),
  'Sec-Browsing-Topics': header(
    'Sends selected Topics API interests for the current user.',
  ),
  'Accept-Signature': header(
    'Indicates which signed-exchange signatures the client supports.',
  ),
  'Early-Data': formattedHeader(
    'Indicates that the request was conveyed in TLS early data.',
    z.literal('1'),
    '1',
  ),
  'Idempotency-Key': formattedHeader(
    'Provides a unique key that makes a POST or PATCH request idempotent.',
    HttpToken,
    '8e03978e-40d5-43e8-bc93-6894a57f9324',
  ),
  'Sec-Speculation-Tags': header(
    'Identifies the speculation rules that caused a speculative request.',
  ),
  'X-Forwarded-For': header(
    'Identifies originating client IP addresses through a proxy or load balancer.',
  ),
  'X-Forwarded-Host': header(
    'Identifies the original host requested through a proxy or load balancer.',
  ),
  'X-Forwarded-Proto': formattedHeader(
    'Identifies the protocol used to connect to a proxy or load balancer.',
    z.enum(['http', 'https']),
    'https',
  ),
  'Pragma': header(
    'Provides directives for compatibility with HTTP/1.0 caches.',
  ),
} satisfies Record<KnownHttpRequestHeaderName, HeaderDefinition>;

export const KnownHttpRequestHeaderMap = z
  .object(buildHeaderShape(KnownHttpRequestHeaderDefinitions))
  .partial();
export type KnownHttpRequestHeaderMap = z.infer<
  typeof KnownHttpRequestHeaderMap
>;

////////////////////////////////////////////////////////////////////////////////
// Response headers
////////////////////////////////////////////////////////////////////////////////

const KnownHttpResponseHeaderDefinitions = {
  'WWW-Authenticate': header(
    'Defines the authentication method that should be used to access a resource.',
  ),
  'Proxy-Authenticate': header(
    'Defines the authentication method used to access a resource through a proxy.',
  ),
  'Age': formattedHeader(
    'The time in seconds that the response has been in a proxy cache.',
    NonNegativeInteger,
    '24',
  ),
  'Cache-Control': header(
    'Directives for caching mechanisms in both requests and responses.',
  ),
  'Clear-Site-Data': header(
    'Clears browsing data associated with the requesting website.',
  ),
  'Expires': formattedHeader(
    'The date and time after which the response is considered stale.',
    HttpDate,
    'Wed, 21 Oct 2015 07:28:00 GMT',
  ),
  'No-Vary-Search': header(
    'Specifies how URL query parameters affect cache matching.',
  ),
  'Last-Modified': formattedHeader(
    'Indicates the last modification date of the resource.',
    HttpDate,
    'Wed, 21 Oct 2015 07:28:00 GMT',
  ),
  'ETag': formattedHeader(
    'Uniquely identifies the version of a resource.',
    EntityTag,
    'W/"0815"',
  ),
  'Vary': formattedHeader(
    'Determines which request headers are used to match a cached response.',
    z.union([z.literal('*'), HttpTokenList]),
    'Accept-Encoding, User-Agent',
  ),
  'Connection': formattedHeader(
    'Controls whether the network connection stays open after the transaction.',
    HttpTokenList,
    'keep-alive',
  ),
  'Keep-Alive': header(
    'Controls how long a persistent connection should stay open.',
  ),
  'Accept-Encoding': header(
    'Indicates which content encodings were used for dynamic response compression.',
  ),
  'Accept-Patch': formattedHeader(
    'Advertises media types accepted in PATCH requests.',
    MediaTypeList,
    'application/json, application/example',
  ),
  'Accept-Post': formattedHeader(
    'Advertises media types accepted in POST requests.',
    MediaTypeList,
    'application/json, text/plain',
  ),
  'Set-Cookie': header('Sends a cookie from the server to the user agent.'),
  'Access-Control-Allow-Credentials': formattedHeader(
    'Indicates whether a credentialed CORS response may be exposed.',
    z.literal('true'),
    'true',
  ),
  'Access-Control-Allow-Headers': formattedHeader(
    'Indicates which headers may be used in the actual CORS request.',
    z.union([z.literal('*'), HttpTokenList]),
    'Content-Type, X-Custom-Header',
  ),
  'Access-Control-Allow-Methods': formattedHeader(
    'Specifies methods allowed for the CORS request.',
    z.union([z.literal('*'), HttpTokenList]),
    'GET, POST, OPTIONS',
  ),
  'Access-Control-Allow-Origin': formattedHeader(
    'Indicates whether the response can be shared with the requesting origin.',
    z.union([z.literal('*'), HttpOrigin]),
    'https://developer.mozilla.org',
  ),
  'Access-Control-Expose-Headers': formattedHeader(
    'Lists response headers that frontend code may access.',
    z.union([z.literal('*'), HttpTokenList]),
    'Content-Encoding, X-Kuma-Revision',
  ),
  'Access-Control-Max-Age': formattedHeader(
    'Indicates how many seconds a CORS preflight result may be cached.',
    NonNegativeInteger,
    '600',
  ),
  'Timing-Allow-Origin': header(
    'Specifies origins allowed to access Resource Timing API values.',
  ),
  'Content-Disposition': header(
    'Indicates whether content should display inline or download as an attachment.',
  ),
  'Content-Digest': header(
    'Provides a digest of the content of an HTTP message.',
  ),
  'Repr-Digest': header(
    'Provides a digest of the selected representation before transmission.',
  ),
  'Want-Content-Digest': header(
    'States the preference for receiving a Content-Digest header.',
  ),
  'Want-Repr-Digest': header(
    'States the preference for receiving a Repr-Digest header.',
  ),
  'Integrity-Policy': header(
    'Requires loaded resources to provide Subresource Integrity guarantees.',
  ),
  'Integrity-Policy-Report-Only': header(
    'Reports resources that would violate a Subresource Integrity policy.',
  ),
  'Content-Length': formattedHeader(
    'The size of the message content in decimal bytes.',
    NonNegativeInteger,
    '3495',
  ),
  'Content-Type': formattedHeader(
    'Indicates the media type of the message content.',
    MediaType,
    'text/html; charset=utf-8',
  ),
  'Content-Encoding': formattedHeader(
    'Specifies encodings applied to the message content.',
    HttpTokenList,
    'gzip, br',
  ),
  'Content-Language': header(
    'Describes the human languages intended for the audience.',
  ),
  'Content-Location': header(
    'Indicates an alternate location for the transferred representation.',
  ),
  'Preference-Applied': header(
    'Informs the client which Prefer request directives were applied.',
  ),
  'Via': header(
    'Identifies intermediate protocols and recipients between the user agent and server.',
  ),
  'Accept-Ranges': formattedHeader(
    'Indicates whether the server supports range requests and their unit.',
    z.union([z.literal('none'), HttpToken]),
    'bytes',
  ),
  'Content-Range': header(
    'Indicates where a partial message belongs within a complete representation.',
  ),
  'Location': header(
    'Indicates the URL to which the user agent should redirect.',
  ),
  'Refresh': header(
    'Directs the browser to reload the page or redirect to another URL.',
  ),
  'Referrer-Policy': formattedHeader(
    'Controls which referrer information is included with requests.',
    HttpTokenList,
    'strict-origin-when-cross-origin',
  ),
  'Allow': formattedHeader(
    'Lists the HTTP request methods supported by a resource.',
    HttpTokenList,
    'GET, HEAD, POST',
  ),
  'Server': header(
    'Contains information about the origin server software handling the request.',
  ),
  'Cross-Origin-Embedder-Policy': formattedHeader(
    'Declares the cross-origin embedder policy for a document.',
    z.enum(['unsafe-none', 'require-corp', 'credentialless']),
    'require-corp',
  ),
  'Cross-Origin-Opener-Policy': formattedHeader(
    'Controls browsing context group sharing with cross-origin documents.',
    z.enum([
      'unsafe-none',
      'same-origin-allow-popups',
      'same-origin',
      'noopener-allow-popups',
    ]),
    'same-origin',
  ),
  'Cross-Origin-Resource-Policy': formattedHeader(
    'Controls which origins may read the response resource.',
    z.enum(['same-site', 'same-origin', 'cross-origin']),
    'same-origin',
  ),
  'Content-Security-Policy': header(
    'Controls which resources the user agent is allowed to load for a page.',
  ),
  'Content-Security-Policy-Report-Only': header(
    'Monitors Content Security Policy violations without enforcing the policy.',
  ),
  'Expect-CT': header(
    'Opts into deprecated Certificate Transparency reporting or enforcement.',
  ),
  'Permissions-Policy': header(
    'Allows or denies browser features in a document and embedded frames.',
  ),
  'Reporting-Endpoints': header(
    'Defines named endpoints that receive browser warning and error reports.',
  ),
  'Strict-Transport-Security': formattedHeader(
    'Forces future communication with the host to use HTTPS.',
    StrictTransportSecurity,
    'max-age=63072000; includeSubDomains; preload',
  ),
  'X-Content-Type-Options': formattedHeader(
    'Disables MIME sniffing and requires the declared Content-Type.',
    z.literal('nosniff'),
    'nosniff',
  ),
  'X-Frame-Options': formattedHeader(
    'Controls whether a browser may render the page in a frame.',
    z.enum(['DENY', 'SAMEORIGIN']),
    'SAMEORIGIN',
  ),
  'X-Permitted-Cross-Domain-Policies': formattedHeader(
    'Controls whether cross-domain policy files may grant access.',
    z.enum([
      'none',
      'master-only',
      'by-content-type',
      'by-ftp-filename',
      'all',
    ]),
    'none',
  ),
  'X-Powered-By': header(
    'Identifies the hosting environment or framework that generated the response.',
  ),
  'X-XSS-Protection': formattedHeader(
    'Controls legacy browser cross-site scripting filtering.',
    matchingHttpFieldValue(
      /^(?:0|1(?:;\s*mode=block|;\s*report=\S+)?)$/,
      'Must be 0, 1, 1; mode=block, or 1; report=<URL>.',
    ),
    '1; mode=block',
  ),
  'Activate-Storage-Access': formattedHeader(
    'Requests activation of an existing Storage Access API permission.',
    z.literal('retry; allowed-origin=*'),
    'retry; allowed-origin=*',
  ),
  'Report-To': formattedHeader(
    'Defines deprecated Reporting API endpoints and groups.',
    JsonText,
    '{"group":"default","max_age":86400,"endpoints":[{"url":"https://example.com/reports"}]}',
  ),
  'Transfer-Encoding': formattedHeader(
    'Specifies the transfer coding used for the message content.',
    HttpTokenList,
    'chunked',
  ),
  'Trailer': formattedHeader(
    'Lists fields included in the trailer section of a chunked message.',
    HttpTokenList,
    'Content-MD5',
  ),
  'Sec-WebSocket-Accept': formattedHeader(
    'Indicates that the server accepts the WebSocket upgrade request.',
    z.base64(),
    's3pPLMBiTxaQ9kYGzzhZRbK+xOo=',
  ),
  'Sec-WebSocket-Extensions': header(
    'Identifies the WebSocket extension selected by the server.',
  ),
  'Sec-WebSocket-Protocol': formattedHeader(
    'Identifies the WebSocket subprotocol selected by the server.',
    HttpToken,
    'chat',
  ),
  'Sec-WebSocket-Version': formattedHeader(
    'Lists WebSocket protocol versions supported by the server.',
    NonNegativeInteger,
    '13',
  ),
  'Alt-Svc': header('Lists alternative ways to reach the service.'),
  'Date': formattedHeader(
    'Contains the date and time at which the message originated.',
    HttpDate,
    'Wed, 21 Oct 2015 07:28:00 GMT',
  ),
  'Link': header('Serializes one or more links in an HTTP header.'),
  'Retry-After': formattedHeader(
    'Indicates how long to wait before a follow-up request.',
    RetryAfter,
    '120',
  ),
  'Server-Timing': header(
    'Communicates metrics and descriptions for the request-response cycle.',
  ),
  'Service-Worker-Allowed': header(
    'Overrides the path restriction for the scope of a service worker.',
  ),
  'SourceMap': header('Links generated or transformed code to its source map.'),
  'Upgrade': header(
    'Lists protocols to which the sender wants to upgrade the connection.',
  ),
  'Priority': header(
    'Provides a hint about the priority of a resource request.',
  ),
  'Attribution-Reporting-Register-Source': header(
    'Registers an attribution source for the Attribution Reporting API.',
  ),
  'Attribution-Reporting-Register-Trigger': header(
    'Registers an attribution trigger for the Attribution Reporting API.',
  ),
  'Accept-CH': formattedHeader(
    'Advertises the client hint headers the server wants to receive.',
    HttpTokenList,
    'Sec-CH-UA-Platform, Sec-CH-UA-Mobile',
  ),
  'Critical-CH': formattedHeader(
    'Identifies accepted client hints that are critical to the response.',
    HttpTokenList,
    'Sec-CH-UA-Bitness',
  ),
  'Use-As-Dictionary': header(
    'Lists criteria for using the response as a compression dictionary.',
  ),
  'Tk': header(
    'Indicates the deprecated tracking status applied to the request.',
  ),
  'Origin-Agent-Cluster': formattedHeader(
    'Requests an origin-keyed agent cluster for the document.',
    z.literal('?1'),
    '?1',
  ),
  'NEL': formattedHeader(
    'Defines a Network Error Logging policy.',
    JsonText,
    '{"report_to":"default","max_age":2592000}',
  ),
  'Observe-Browsing-Topics': formattedHeader(
    'Marks inferred Topics API interests as observed.',
    z.literal('?1'),
    '?1',
  ),
  'Set-Login': header(
    'Sets the login status of a federated identity provider for FedCM.',
  ),
  'Signature': header('Conveys signatures for an HTTP exchange.'),
  'Signed-Headers': formattedHeader(
    'Identifies response fields included in a signature.',
    HttpTokenList,
    'Content-Type, Content-Digest',
  ),
  'Speculation-Rules': header(
    'Lists URLs containing speculation rule JSON definitions.',
  ),
  'Supports-Loading-Mode': formattedHeader(
    'Opts a navigation target into higher-risk loading modes.',
    HttpTokenList,
    'credentialed-prerender',
  ),
  'X-DNS-Prefetch-Control': formattedHeader(
    'Controls proactive browser DNS prefetching.',
    z.enum(['on', 'off']),
    'off',
  ),
  'X-Robots-Tag': header(
    'Controls how a web page is indexed in public search results.',
  ),
  'Pragma': header(
    'Provides directives for compatibility with HTTP/1.0 caches.',
  ),
  'Warning': header(
    'Conveys deprecated warning information about possible response problems.',
  ),
} satisfies Record<KnownHttpResponseHeaderName, HeaderDefinition>;

export const KnownHttpResponseHeaderMap = z
  .object(buildHeaderShape(KnownHttpResponseHeaderDefinitions))
  .partial();
export type KnownHttpResponseHeaderMap = z.infer<
  typeof KnownHttpResponseHeaderMap
>;
