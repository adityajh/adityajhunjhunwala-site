const { DateTime } = require("luxon");

module.exports = function(eleventyConfig) {

  // --- Passthrough copies ---
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("js");
  

  // --- Filters ---

  // Format date: "7 March 2024"
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(new Date(dateObj), { zone: "utc" }).toFormat("d MMMM yyyy");
  });

  // Format date for datetime attr: "2024-03-07"
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    if (!dateObj) return "";
    return DateTime.fromJSDate(new Date(dateObj), { zone: "utc" }).toFormat("yyyy-MM-dd");
  });

  // Strip Obsidian wiki-link image embeds: ![[filename]] -> <img src="/images/letter-NNN/filename">
  eleventyConfig.addFilter("obsidianImages", (content, letterSlug) => {
    if (!content) return content;
    // Replace ![[filename]] with img tag
    return content.replace(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, (match, filename) => {
      const ext = filename.split('.').pop().toLowerCase();
      // Skip PDFs and videos
      if (['pdf', 'mp4', 'mov', 'avi'].includes(ext)) return '';
      const slug = letterSlug || 'images';
      const cleanName = filename.replace(/\s+/g, '-').toLowerCase();
      return `<img src="/images/${slug}/${cleanName}" alt="" loading="lazy" class="letter-image">`;
    });
  });

  // Scrub em and en dashes from content
  eleventyConfig.addFilter("scrubDashes", (content) => {
    if (!content) return content;
    return content
      .replace(/—/g, ', ')   // em dash → comma-space
      .replace(/–/g, '-')    // en dash → hyphen
      .replace(/ -- /g, ', ');    // double hyphen → comma-space
  });

  // Get N most recent items from a collection
  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array) || n < 0) return array;
    return array.slice(0, n);
  });

  // Truncate text
  eleventyConfig.addFilter("truncate", (str, len) => {
    if (!str) return "";
    if (str.length <= len) return str;
    return str.slice(0, len).trim() + "...";
  });

  // Strip markdown/HTML for meta description
  eleventyConfig.addFilter("plainText", (str) => {
    if (!str) return "";
    return str
      .replace(/!\[\[[^\]]*\]\]/g, '')    // obsidian embeds
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // markdown links
      .replace(/<[^>]+>/g, '')             // HTML tags
      .replace(/#{1,6}\s/g, '')            // headings
      .replace(/[*_`~]/g, '')              // formatting
      .replace(/\n{2,}/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  });

  // --- Collections ---

  // Letters: sorted by letter_number ascending
  eleventyConfig.addCollection("letters", (collectionApi) => {
    return collectionApi.getFilteredByGlob("letters/*.md")
      .sort((a, b) => (a.data.letter_number || 0) - (b.data.letter_number || 0));
  });

  // Letters: newest first (for home page + list)
  eleventyConfig.addCollection("lettersNewest", (collectionApi) => {
    return collectionApi.getFilteredByGlob("letters/*.md")
      .sort((a, b) => (b.data.letter_number || 0) - (a.data.letter_number || 0));
  });

  // Articles
  eleventyConfig.addCollection("articles", (collectionApi) => {
    return collectionApi.getFilteredByGlob("writing/*.md")
      .sort((a, b) => {
        // Sort by date desc, then alphabetically
        const da = a.data.date ? new Date(a.data.date) : new Date(0);
        const db = b.data.date ? new Date(b.data.date) : new Date(0);
        return db - da;
      });
  });

  // All tags across letters
  eleventyConfig.addCollection("letterTags", (collectionApi) => {
    const tagSet = new Set();
    collectionApi.getFilteredByGlob("letters/*.md").forEach(item => {
      (item.data.tags || []).forEach(tag => {
        if (tag !== "published" && tag !== "letter") tagSet.add(tag);
      });
    });
    return [...tagSet].sort();
  });

  // --- Markdown config ---
  const markdownIt = require("markdown-it");
  const md = markdownIt({ html: true, breaks: true, linkify: true });
  eleventyConfig.setLibrary("md", md);

  // --- Global data ---
  eleventyConfig.addGlobalData("siteUrl", "https://www.adityajhunjhunwala.com");
  eleventyConfig.addGlobalData("currentYear", new Date().getFullYear());

  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["md", "njk", "html"]
  };
};
