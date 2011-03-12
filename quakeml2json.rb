require 'rubygems'
require 'hpricot'
require 'json'

xml = STDIN.read

doc = Hpricot::XML(xml)

events = []
(doc/'event').each do |event|
  events << {
    :lat  => (event/'latitude value').text.to_f * -1.0,
    :lon  => (event/'longitude value').text.to_f,
    :z    => (event/'depth value').text.to_f,
    :mag  => (event/'mag value').text.to_f,
  }
end

print 'var earthquakes = '
print events.to_json
puts ';'
