const fs = require("fs");
const replace = require("./replacement").gulp;

function wrapTemplate(templatePath, variables) {
    let template = fs.readFileSync(templatePath).toString();

    if (variables) {
        variables.forEach(variable => {
            template = template.replace(variable[0], variable[1]);
        });
    }

    template = template.split(/\/\*content\*\//);

    const replacements = [];
    if (template[0]) {
        replacements.push([/^/, template[0]]);
    }
    if (template[1]) {
        replacements.push([/$/, template[1]]);
    }

    return replace(replacements);
}

module.exports = wrapTemplate;
