module.exports = {
	bold: (content) => `**${content}**`,
    italic: (content) => `_${content}_`,
    underscore: (content) => `__${content}__`,
    mention: (userId) => `<@${userId}>`,
};