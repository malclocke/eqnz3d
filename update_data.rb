#!/usr/bin/env ruby

require 'net/http'
require 'date'


q = "startDate=2011-02-21&endDate=#{DateTime.now.strftime('%Y-%m-%d')}&latLower=-44.05993&latUpper=-43.14426&longLower=171.54967&longUpper=173.27152"

res = Net::HTTP.get_response(
  URI.parse("http://magma.geonet.org.nz/services/quake/quakeml/1.0.1/query?#{q}")
)

puts res.body
