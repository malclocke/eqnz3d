all: earthquakes.js

earthquakes.js: earthquakes.xml
	ruby quakeml2json.rb < earthquakes.xml > earthquakes.js

earthquakes.xml: dummy
	ruby update_data.rb > earthquakes.xml

dummy:

clean:
	rm -f earthquakes.json earthquakes.xml
