#!/usr/local/bin/perl -w

use DBI;
use CGI qw/:standard/;
use CGI::Carp qw/fatalsToBrowser/;
use Mojo::JSON;

use strict;

our @db = ();
require 'chat.config';

my $dbh = DBI->connect(@db);
$dbh->do('SET NAMES UTF8');

my $data;
my $method = param('method') || url_param('method');

if ($method eq 'register') {
	my @voc = ('a'..'z', 0..9);
	my $session = cookie('agentId');

	if ($session) {

	} else {
		$session = join '-', (split /(.{8})(.{4})(.{4})(.{4})(.{12})/, (join '', map { $voc[rand()*@voc] } 1..32))[1..5];
	}

	$data = {
		  status => 'ok'
		, agentId => $session
	};
} elsif ($method =~ /^connect\/([\a-z0-9\-]+)$/) {
	my $session = $1;
	my $start_time = time();
	my $timeout = 15;
	my $messages = [];

	$dbh->do('');

	while (1) {
		if (0 || time() - $timeout > $start_time) { # get message from db
#			$messages = []
			last;
		} else {
			sleep 1;
		};
	}
	$data = {
		  status => 'ok'
		, msg => $messages
	}
}

print header(-content_type => "application/json");
print Mojo::JSON->encode($data);


1;