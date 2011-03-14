require 'rubygems'
require 'hpricot'
require 'json'

maxlat = -43.14426
minlat = -44.05993
minlon = 171.54967
maxlon = 173.27152

xml = File.read('foo.xml')
doc = Hpricot::XML(xml)

nodes = []
(doc/'node').each do |node|
  lat = node.attributes['lat'].to_f * -1
  lon = node.attributes['lon'].to_f
  id = node.attributes['id'].to_i
  nodes << {:lat => lat, :lon => lon, :id => id}
end
print "var map_nodes = "
print nodes.to_json
puts ';'
