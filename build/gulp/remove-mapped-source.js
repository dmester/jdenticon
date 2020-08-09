const { Transform } = require("stream");
const { SourceMapConsumer, SourceMapGenerator } = require("source-map");

function removeMappedSourceStream(...sourceNames) {
    const sourceNamesToRemove = new Set(sourceNames);

    return new Transform({
        objectMode: true,
        
        transform(inputFile, _, fileDone) {
            if (inputFile.sourceMap) {
                let consumer = inputFile.sourceMap;
                if (!(consumer instanceof SourceMapConsumer)) {
                    consumer = new SourceMapConsumer(consumer);
                }

                const generator = new SourceMapGenerator({
                    file: consumer.file,
                    sourceRoot: consumer.sourceRoot,
                });

                consumer.sources.forEach(sourceFile => {
                    const content = consumer.sourceContentFor(sourceFile);
                    if (content != null && !sourceNamesToRemove.has(sourceFile)) {
                        generator.setSourceContent(sourceFile, content);
                    }
                });

                consumer.eachMapping(mapping => {
                    if (!sourceNamesToRemove.has(mapping.source)) {
                        generator.addMapping({
                            original: {
                                line: mapping.originalLine,
                                column: mapping.originalColumn,
                            },
                            generated: {
                                line: mapping.generatedLine,
                                column: mapping.generatedColumn,
                            },
                            source: mapping.source,
                            name: mapping.name,
                        });
                    }
                });

                inputFile.sourceMap = generator.toJSON();
            }

            fileDone(null, inputFile);
        }
    });
}

module.exports = removeMappedSourceStream;
