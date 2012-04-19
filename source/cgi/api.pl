#!/usr/local/bin/perl -w

use DBI;
use CGI qw/:standard/;
use CGI::Carp qw/fatalsToBrowser/;
use Mojo::JSON;
use utf8;

use strict;

our @db = ();
require 'chat.config';

my $dbh = DBI->connect(@db);
$dbh->do('SET NAMES UTF8');

my $data;
my $true = Mojo::JSON->true;
my $false = Mojo::JSON->false;

my $method = param('method') || url_param('method');

if ($method eq 'getSettings') {
	$data = {
		  'lang' => 'ru'
		, 'theme' => 'default'
		, 'mode' => 'chat'
	};
} elsif ($method eq 'getObject') {

	my $widget_id = param('id');

	if ($widget_id eq 'null') {
		$data = {()
			, children => [['main']]
		}

	} elsif ($widget_id eq 'main') {
		$data = {()
			, widget_name => "main"
			, template_name => "main"
			, tray => 1
			, children => [['user']]
			, widget_size_type => "main"
			, need_data => $false
			, draw_if_null => $true
			, trays => [["blank"]]
			, widget_id => "main"
			, voc => {
				'login' => 'Кто здесь?'
			  }
		}

	} elsif ($widget_id eq 'user') {
		$data = {()
			, widget_name => "user"
			, template_name => "user"
			, tray => 1
			, children => []
			, widget_size_type => "blank"
			, need_data => $false
			, draw_if_null => $true
			, trays => []
			, widget_id => "user"
			, voc => {
				'register_please' => 'Зарегистрироваться'
			  }
		}

	} elsif ($widget_id eq 'room') {
		$data = {()
			, widget_name => "room"
			, template_name => "room"
			, tray => 1
			, children => []
			, widget_size_type => "blank"
			, need_data => $false
			, draw_if_null => $true
			, trays => []
			, widget_id => "room"
			, voc => {
				'send' => 'Отправить'
			  }
		}

	} elsif ($widget_id eq 'contact_list') {
		$data = {()
			, widget_name => "contact_list"
			, template_name => "contact_list"
			, tray => 1
			, children => []
			, widget_size_type => "blank"
			, need_data => $false
			, draw_if_null => $true
			, trays => []
			, widget_id => "contact_list"
#			, voc => {
#				'' => ''
#			  }
		}

	}

} elsif ($method eq 'getData') {
}

print header(-content_type => "application/json");
print Mojo::JSON->encode($data);


1;