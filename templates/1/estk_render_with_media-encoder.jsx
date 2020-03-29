//@target aftereffects

(function main () {
	const aeProjectImportOptions = new ImportOptions(File('C:/Users/sandb/Downloads/automated-video-maker/templates/1/template.aep'))
	
	// Open Adobe After Effects with a project.
    app.project.importFile(aeProjectImportOptions)
    
    if (app.project.renderQueue.canQueueInAME === true) {
		// Open Adobe Media Encoder, but not start render.
        app.project.renderQueue.queueInAME(false);
    } else {
		alert("There are no queued item in the Render Queue.");
    }
})()