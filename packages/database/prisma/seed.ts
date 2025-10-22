import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@fittrack.com' },
    update: {},
    create: {
      email: 'test@fittrack.com',
      name: 'Test User',
      plan: 'FREE',
    },
  });

  console.log('✅ Created user:', user.email);

  // Workout data from your JSON file
  const workoutsData = [
    {
      date: new Date("2025-10-13"),
      workoutType: "Outdoor Walk",
      workoutTime: "0:37:44",
      distanceKm: 4.28,
      activeKcal: 260,
      totalKcal: 311,
      elevationGainM: 102,
      avgPace: "8'49\"/km",
      avgHeartRateBpm: 150,
      effortLevel: 7,
      effortDescription: "Hard",
      source: "SCREENSHOT" as const,
      splits: [
        { splitNumber: 1, time: "10:00", pace: "10'00\"", heartRateBpm: 116 },
        { splitNumber: 2, time: "06:32", pace: "6'32\"", heartRateBpm: 169 },
        { splitNumber: 3, time: "08:53", pace: "8'53\"", heartRateBpm: 165 },
        { splitNumber: 4, time: "09:05", pace: "9'05\"", heartRateBpm: 153 },
        { splitNumber: 5, time: "02:27", pace: "8'44\"", heartRateBpm: 160 }
      ]
    },
    {
      date: new Date("2025-10-10"),
      workoutType: "Outdoor Walk",
      workoutTime: "0:39:06",
      distanceKm: 4.25,
      activeKcal: 254,
      totalKcal: 306,
      elevationGainM: 104,
      avgPace: "9'11\"/km",
      avgHeartRateBpm: 150,
      effortLevel: 8,
      effortDescription: "Hard",
      source: "SCREENSHOT" as const,
      splits: [
        { splitNumber: 1, time: "09:22", pace: "9'22\"", heartRateBpm: 124 },
        { splitNumber: 2, time: "06:45", pace: "6'45\"", heartRateBpm: 160 },
        { splitNumber: 3, time: "09:12", pace: "9'12\"", heartRateBpm: 159 },
        { splitNumber: 4, time: "09:20", pace: "9'20\"", heartRateBpm: 160 },
        { splitNumber: 5, time: "04:08", pace: "15'58\"", heartRateBpm: 149 }
      ]
    },
    {
      date: new Date("2025-10-07"),
      workoutType: "Outdoor Walk",
      workoutTime: "1:21:48",
      elapsedTime: "1:21:53",
      distanceKm: 6.87,
      activeKcal: 423,
      totalKcal: 533,
      elevationGainM: 88,
      avgPace: "11'54\"/km",
      avgHeartRateBpm: 140,
      effortLevel: 7,
      effortDescription: "Hard",
      source: "SCREENSHOT" as const,
      splits: [
        { splitNumber: 1, time: "15:49", pace: "15'49\"", heartRateBpm: 120 },
        { splitNumber: 2, time: "09:29", pace: "9'29\"", heartRateBpm: 140 },
        { splitNumber: 3, time: "09:57", pace: "9'57\"", heartRateBpm: 140 },
        { splitNumber: 4, time: "13:48", pace: "13'48\"", heartRateBpm: 143 },
        { splitNumber: 5, time: "10:18", pace: "10'18\"", heartRateBpm: 149 }
      ]
    },
    {
      date: new Date("2025-10-02"),
      workoutType: "Outdoor Walk",
      workoutTime: "0:43:13",
      distanceKm: 4.07,
      activeKcal: 240,
      totalKcal: 299,
      elevationGainM: 102,
      avgPace: "10'36\"/km",
      avgHeartRateBpm: 132,
      effortLevel: 5,
      effortDescription: "Moderate",
      source: "SCREENSHOT" as const,
      splits: [
        { splitNumber: 1, time: "11:07", pace: "11'07\"", heartRateBpm: 111 },
        { splitNumber: 2, time: "09:49", pace: "9'49\"", heartRateBpm: 130 },
        { splitNumber: 3, time: "10:37", pace: "10'37\"", heartRateBpm: 146 },
        { splitNumber: 4, time: "10:25", pace: "10'25\"", heartRateBpm: 143 },
        { splitNumber: 5, time: "01:13", pace: "16'13\"", heartRateBpm: 141 }
      ]
    },
    {
      date: new Date("2025-09-30"),
      workoutType: "Outdoor Walk",
      workoutTime: "0:44:55",
      distanceKm: 4.22,
      activeKcal: 253,
      totalKcal: 313,
      elevationGainM: 102,
      avgPace: "10'38\"/km",
      avgHeartRateBpm: 139,
      effortLevel: 7,
      effortDescription: "Hard",
      source: "SCREENSHOT" as const,
      splits: [
        { splitNumber: 1, time: "12:25", pace: "12'25\"", heartRateBpm: 116 },
        { splitNumber: 2, time: "08:44", pace: "8'44\"", heartRateBpm: 154 },
        { splitNumber: 3, time: "09:18", pace: "9'18\"", heartRateBpm: 152 },
        { splitNumber: 4, time: "10:38", pace: "10'38\"", heartRateBpm: 141 },
        { splitNumber: 5, time: "03:16", pace: "14'41\"", heartRateBpm: 137 }
      ]
    },
    {
      date: new Date("2025-09-29"),
      workoutType: "Outdoor Walk",
      workoutTime: "0:47:30",
      distanceKm: 4.44,
      activeKcal: 260,
      totalKcal: 323,
      elevationGainM: 110,
      avgPace: "10'41\"/km",
      avgHeartRateBpm: 132,
      effortLevel: 7,
      effortDescription: "Hard",
      source: "SCREENSHOT" as const,
      splits: [
        { splitNumber: 1, time: "11:16", pace: "11'16\"", heartRateBpm: 111 },
        { splitNumber: 2, time: "10:45", pace: "10'45\"", heartRateBpm: 130 },
        { splitNumber: 3, time: "09:16", pace: "9'16\"", heartRateBpm: 151 },
        { splitNumber: 4, time: "09:57", pace: "9'57\"", heartRateBpm: 137 },
        { splitNumber: 5, time: "05:59", pace: "13'22\"", heartRateBpm: 138 }
      ]
    },
    {
      date: new Date("2025-09-25"),
      workoutType: "Outdoor Walk",
      workoutTime: "0:43:36",
      elapsedTime: "0:43:41",
      distanceKm: 2.52,
      activeKcal: 140,
      totalKcal: 199,
      elevationGainM: 42,
      avgPace: "17'15\"/km",
      avgHeartRateBpm: 121,
      effortLevel: 6,
      effortDescription: "Moderate",
      source: "SCREENSHOT" as const,
      splits: [
        { splitNumber: 1, time: "12:50", pace: "12'50\"", heartRateBpm: 118 },
        { splitNumber: 2, time: "20:16", pace: "20'16\"", heartRateBpm: 119 },
        { splitNumber: 3, time: "09:29", pace: "17'57\"", heartRateBpm: 132 }
      ]
    }
  ];

  // Create workouts with splits
  for (const workoutData of workoutsData) {
    const { splits, ...workoutFields } = workoutData;

    const workout = await prisma.workout.create({
      data: {
        ...workoutFields,
        userId: user.id,
        splits: {
          create: splits,
        },
      },
      include: {
        splits: true,
      },
    });

    console.log(`✅ Created workout on ${workout.date.toLocaleDateString()} with ${workout.splits.length} splits`);
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
