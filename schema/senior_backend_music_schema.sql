-- senior_backend_music_schema.sql
-- Database: music_streaming_v2
-- Refined schema following plural naming conventions and proper indexing

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for songs
-- ----------------------------
DROP TABLE IF EXISTS `songs`;
CREATE TABLE `songs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `artist` varchar(255) DEFAULT NULL,
  `cover_url` text COMMENT 'YouTube thumbnail URL',
  `source_id` varchar(50) NOT NULL COMMENT 'YouTube video ID',
  `duration` int(11) DEFAULT NULL COMMENT 'Duration in seconds',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_source_id` (`source_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for playlists
-- ----------------------------
DROP TABLE IF EXISTS `playlists`;
CREATE TABLE `playlists` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_playlists_user` (`user_id`),
  CONSTRAINT `fk_playlists_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Table structure for playlist_songs
-- ----------------------------
DROP TABLE IF EXISTS `playlist_songs`;
CREATE TABLE `playlist_songs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `playlist_id` int(11) NOT NULL,
  `song_id` int(11) NOT NULL,
  `urutan` int(11) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_playlist_song_unique` (`playlist_id`,`song_id`),
  KEY `idx_playlist_id` (`playlist_id`),
  KEY `fk_playlist_songs_song` (`song_id`),
  CONSTRAINT `fk_playlist_songs_playlist` FOREIGN KEY (`playlist_id`) REFERENCES `playlists` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_playlist_songs_song` FOREIGN KEY (`song_id`) REFERENCES `songs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- Dummy Data for users
-- ----------------------------
INSERT INTO `users` (`username`, `password`) VALUES 
('dev_senior', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('music_guru', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'),
('audiophile_99', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');

-- ----------------------------
-- Dummy Data for songs
-- ----------------------------
INSERT INTO `songs` (`title`, `artist`, `cover_url`, `source_id`, `duration`) VALUES 
('Starboy', 'The Weeknd', 'https://img.youtube.com/vi/34Na4j8AVgA/0.jpg', '34Na4j8AVgA', 230),
('Midnight City', 'M83', 'https://img.youtube.com/vi/dX3k_UAnyf4/0.jpg', 'dX3k_UAnyf4', 243),
('Instant Crush', 'Daft Punk', 'https://img.youtube.com/vi/a5uQMwRMHcs/0.jpg', 'a5uQMwRMHcs', 339);

-- ----------------------------
-- Dummy Data for playlists
-- ----------------------------
INSERT INTO `playlists` (`name`, `user_id`) VALUES 
('Late Night Driving', 1),
('Synthwave Essentials', 1),
('Coffee Shop Mix', 2);

-- ----------------------------
-- Dummy Data for playlist_songs
-- ----------------------------
INSERT INTO `playlist_songs` (`playlist_id`, `song_id`, `urutan`) VALUES 
(1, 1, 1),
(1, 2, 2),
(2, 2, 1);

SET FOREIGN_KEY_CHECKS = 1;
