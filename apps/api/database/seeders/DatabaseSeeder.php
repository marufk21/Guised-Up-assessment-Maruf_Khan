<?php

namespace Database\Seeders;

use App\Models\Interaction;
use App\Models\Post;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $referenceTime = CarbonImmutable::parse('2026-07-13 12:00:00', 'UTC');
        $users = [];

        foreach ([
            ['name' => 'Maruf Khan', 'email' => 'maruf@example.com'],
            ['name' => 'Priya Kapoor', 'email' => 'priya@example.com'],
            ['name' => 'Karan Verma', 'email' => 'karan@example.com'],
        ] as $demoUser) {
            $user = User::query()->updateOrCreate(
                ['email' => $demoUser['email']],
                [
                    'name' => $demoUser['name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => $referenceTime,
                ],
            );

            $user->forceFill([
                'created_at' => $referenceTime,
                'updated_at' => $referenceTime,
            ])->saveQuietly();

            $users[$demoUser['email']] = $user;
        }

        $postDefinitions = [
            'maruf-monsoon' => [
                'author' => 'maruf@example.com',
                'text' => 'The first monsoon downpour caught me mid-cycle on Linking Road. Reached home soaked, laughing, and smelling of wet earth.',
                'image_url' => null,
                'authenticity_score' => 0.9300,
                'created_at' => '2026-06-08 17:30:00',
            ],
            'maruf-piano' => [
                'author' => 'maruf@example.com',
                'text' => 'Tried learning that one AR Rahman riff on the keyboard for three hours. My neighbours must hate me, but I almost have it down.',
                'image_url' => null,
                'authenticity_score' => 0.8500,
                'created_at' => '2026-06-15 21:15:00',
            ],
            'maruf-bookstore' => [
                'author' => 'maruf@example.com',
                'text' => 'Found a secondhand copy of a book I loved in college at a Fort bookstall. The margins still have someone else\'s pencil notes.',
                'image_url' => 'https://placehold.co/1200x800/png?text=Old+Bookstore',
                'authenticity_score' => 0.9100,
                'created_at' => '2026-06-23 14:00:00',
            ],
            'maruf-biryani' => [
                'author' => 'maruf@example.com',
                'text' => 'My first attempt at Hyderabadi biryani. The layering was messy, the raita saved it, and my flatmates asked for seconds anyway.',
                'image_url' => 'https://placehold.co/1200x800/png?text=Homemade+Biryani',
                'authenticity_score' => 0.8800,
                'created_at' => '2026-07-03 19:45:00',
            ],
            'maruf-sprint' => [
                'author' => 'maruf@example.com',
                'text' => 'Wrapped a two-month feature branch today. The merge was clean, the tests passed, and I treated myself to a long walk after.',
                'image_url' => null,
                'authenticity_score' => 0.7900,
                'created_at' => '2026-07-10 16:10:00',
            ],
            'priya-terrace' => [
                'author' => 'priya@example.com',
                'text' => 'Sat on the terrace with my grandmother while she told me about her first teaching job in a one-room school. Forty years later she still remembers every student.',
                'image_url' => null,
                'authenticity_score' => 0.9600,
                'created_at' => '2026-06-10 18:30:00',
            ],
            'priya-jalebi' => [
                'author' => 'priya@example.com',
                'text' => 'Made jalebis from scratch at 11pm because I couldn\'t sleep. The kitchen was a sticky disaster zone but the first bite was worth it.',
                'image_url' => 'https://placehold.co/1200x800/png?text=Jalebi',
                'authenticity_score' => 0.8900,
                'created_at' => '2026-06-17 23:20:00',
            ],
            'priya-design' => [
                'author' => 'priya@example.com',
                'text' => 'A junior designer asked me to review their work today. Their solution was simpler and braver than anything I would have drawn.',
                'image_url' => null,
                'authenticity_score' => 0.8700,
                'created_at' => '2026-06-25 15:05:00',
            ],
            'priya-kolhapur' => [
                'author' => 'priya@example.com',
                'text' => 'Took a bus to Kolhapur for no good reason. Ate misal pav at a stall where the owner has been running it since 1982. Days like this feel stolen.',
                'image_url' => 'https://placehold.co/1200x800/png?text=Kolhapur+Trip',
                'authenticity_score' => 0.9400,
                'created_at' => '2026-07-05 12:40:00',
            ],
            'priya-night' => [
                'author' => 'priya@example.com',
                'text' => 'The deadline moved and nobody panicked. We just shuffled the board, cut one feature, and went home at a reasonable hour. Growth.',
                'image_url' => null,
                'authenticity_score' => 0.8200,
                'created_at' => '2026-07-12 20:00:00',
            ],
            'karan-cycling' => [
                'author' => 'karan@example.com',
                'text' => 'Started cycling to work this week. The Powai stretch at 7am is misty and quiet and makes the rest of the day feel doable.',
                'image_url' => null,
                'authenticity_score' => 0.9000,
                'created_at' => '2026-06-11 08:00:00',
            ],
            'karan-dosa' => [
                'author' => 'karan@example.com',
                'text' => 'Discovered a tiny dosa spot behind the station that has been there for decades. The chutney was so good I went back the next morning.',
                'image_url' => 'https://placehold.co/1200x800/png?text=Dosa+Spot',
                'authenticity_score' => 0.8600,
                'created_at' => '2026-06-19 09:30:00',
            ],
            'karan-postgres' => [
                'author' => 'karan@example.com',
                'text' => 'Spent the afternoon explaining a query plan to myself out loud. The index worked, the EXPLAIN was beautiful, and I felt absurdly proud.',
                'image_url' => null,
                'authenticity_score' => 0.7500,
                'created_at' => '2026-06-27 16:20:00',
            ],
            'karan-guitar' => [
                'author' => 'karan@example.com',
                'text' => 'Dusted off my old acoustic after two years. My fingers are soft and the strings are dead, but humming along felt like coming home.',
                'image_url' => null,
                'authenticity_score' => 0.9200,
                'created_at' => '2026-07-07 21:45:00',
            ],
            'karan-release' => [
                'author' => 'karan@example.com',
                'text' => 'Cut a release on a Friday and nothing caught fire. Checked the dashboards from a café instead of the office. This is the dream.',
                'image_url' => null,
                'authenticity_score' => 0.8100,
                'created_at' => '2026-07-13 10:30:00',
            ],
        ];

        $posts = [];

        foreach ($postDefinitions as $key => $definition) {
            $post = Post::query()->updateOrCreate(
                [
                    'user_id' => $users[$definition['author']]->id,
                    'text' => $definition['text'],
                ],
                [
                    'image_url' => $definition['image_url'],
                    'authenticity_score' => $definition['authenticity_score'],
                    'vector_document_id' => null,
                    'embedding_status' => Post::EMBEDDING_PENDING,
                    'embedding_error' => null,
                ],
            );

            $postTime = CarbonImmutable::parse($definition['created_at'], 'UTC');
            $post->forceFill([
                'created_at' => $postTime,
                'updated_at' => $postTime,
            ])->saveQuietly();

            $posts[$key] = $post;
        }

        $interactionDefinitions = [
            ['maruf@example.com', 'priya-terrace', Interaction::TYPE_VIEW, '2026-06-11 08:00:00'],
            ['maruf@example.com', 'priya-terrace', Interaction::TYPE_REACTION, '2026-06-11 08:05:00'],
            ['maruf@example.com', 'priya-jalebi', Interaction::TYPE_VIEW, '2026-06-18 10:30:00'],
            ['maruf@example.com', 'priya-jalebi', Interaction::TYPE_REACTION, '2026-06-18 10:33:00'],
            ['maruf@example.com', 'priya-jalebi', Interaction::TYPE_REPLY, '2026-06-18 10:45:00'],
            ['maruf@example.com', 'priya-kolhapur', Interaction::TYPE_VIEW, '2026-07-06 09:00:00'],
            ['maruf@example.com', 'priya-kolhapur', Interaction::TYPE_REACTION, '2026-07-06 09:02:00'],
            ['maruf@example.com', 'karan-cycling', Interaction::TYPE_VIEW, '2026-06-15 07:45:00'],
            ['maruf@example.com', 'karan-guitar', Interaction::TYPE_REACTION, '2026-07-09 18:20:00'],
            ['priya@example.com', 'maruf-monsoon', Interaction::TYPE_VIEW, '2026-06-13 12:15:00'],
            ['priya@example.com', 'maruf-bookstore', Interaction::TYPE_REACTION, '2026-06-25 16:10:00'],
            ['priya@example.com', 'maruf-biryani', Interaction::TYPE_VIEW, '2026-07-04 20:30:00'],
            ['priya@example.com', 'maruf-biryani', Interaction::TYPE_REPLY, '2026-07-04 20:40:00'],
            ['priya@example.com', 'karan-dosa', Interaction::TYPE_VIEW, '2026-06-22 11:00:00'],
            ['karan@example.com', 'maruf-piano', Interaction::TYPE_VIEW, '2026-06-19 19:10:00'],
            ['karan@example.com', 'priya-design', Interaction::TYPE_REACTION, '2026-06-28 15:30:00'],
            ['karan@example.com', 'priya-night', Interaction::TYPE_VIEW, '2026-07-13 08:15:00'],
            ['karan@example.com', 'maruf-sprint', Interaction::TYPE_REACTION, '2026-07-12 17:00:00'],
        ];

        foreach ($interactionDefinitions as [$email, $postKey, $type, $createdAt]) {
            $interaction = Interaction::query()->updateOrCreate([
                'user_id' => $users[$email]->id,
                'post_id' => $posts[$postKey]->id,
                'type' => $type,
            ]);

            $interactionTime = CarbonImmutable::parse($createdAt, 'UTC');
            $interaction->forceFill([
                'created_at' => $interactionTime,
                'updated_at' => $interactionTime,
            ])->saveQuietly();
        }
    }
}
