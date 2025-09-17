require 'set'
require 'json'

pattern = Regexp.new(ARGV[0])
mode = ARGV[1]
do_action = ARGV[2]

commands = `just --summary`
    .split(' ')
    .filter { |task| (task =~ pattern) != nil }

case mode
when 'changed'
    # Check if we're in a git repository
    if system('git rev-parse --git-dir > /dev/null 2>&1')
        `git fetch`
        parent = `git merge-base HEAD origin/main`.chomp
        changed = `git diff "#{parent}" --name-only`
            .split("\n")
            .filter { |file| file.include? '/' }
            .map { |file| file.split('/').first }
            .to_set
            .to_a
            .join('|')
        changed_regex = /-(#{changed})$/
        commands.filter! { |task| (task =~ changed_regex) != nil }
    else
        # If not in git repo, treat as 'all' mode
        puts "Not in a git repository, running all matching tasks"
    end
when 'typescript'
    ts_folders = `ls */package.json`
        .split("\n")
        .map { |file| file.split('/').first }
        .to_set
        .to_a
        .join('|')
    ts_regex = /-(#{ts_folders})$/
    commands.filter! { |task| (task =~ ts_regex) != nil }
when 'all'
    # we already run them all without changing anything
else
    package_regex = /-(#{mode})$/
    commands.filter! { |task| (task =~ package_regex) != nil }
end

if do_action == 'run'
    Kernel.exec("just #{commands.join(' ')}") unless commands.empty?
else
    puts JSON.generate(commands.map{ |s| s.split('-', 2)[1] })
end
