<?php
define('UPLOAD_DIR', 'uploads/');

if(!empty($_POST)){
	
    $img = $_POST['image'];
    $file = UPLOAD_DIR . uniqid() . '.jpg';
    $success = file_put_contents($file, base64_decode($img));
    $data1[] = $file;

	echo json_encode($data1);
	
} else {
	?>
<!doctype html>
<html>
	<head>
		<meta charset="UTF-8">
		<title>Rodocam archives</title>
		<link href="css/featherlight.min.css" type="text/css" rel="stylesheet" />
		<!--<meta http-equiv="refresh" content="5">-->
		<style>
			
			.itemwrapper img{
				width: 360px;
			}
			.itemwrapper .date{
				padding: 10px;
			}
			body {
				font-family: Helvetica, Arial, sans-serif;
				font-weight: 400;
				font-size: 14px;
				margin: 0px;
				padding: 0 25px 25px 25px;
			}
			.itemwrapper{
				display: inline-flex;
				flex-flow: column;
				align-items: center;
				margin: 0 10px 10px 0;
				border: 1px solid #cecece;
			}
			
			.featherlight-content .caption{
				position: absolute;
				bottom: 0;
				width: calc(100% - 50px);
				background: rgba(255,255,255,.5);
				padding: 5px 10px;
				text-align: center;
			}
        </style>
	</head>
	<body>
	<h1>Rodocam V1</h1>

<?php
	// afficher images
	$images_arr = array_reverse(glob(UPLOAD_DIR.'*'));

	foreach( $images_arr as $filename){
		if( basename($filename) === "index.php" ){
			continue;
		}
		?>
		
		<div class="itemwrapper">
			<a href='<?php echo $filename; ?>' data-featherlight='image'>
				<img title='<?php echo date ("d M Y H:i:s.", filemtime($filename)); ?>' src='<?php echo $filename; ?>' />
			</a>
			<div class="date"><?php echo date ("d M Y H:i:s.", filemtime($filename)); ?></div>
		</div>
		
		<?php
	}
	?>
		<script src="//code.jquery.com/jquery-latest.js"></script>
		<script src="js/featherlight.min.js" type="text/javascript" charset="utf-8"></script>
		<script>
			$.featherlight.prototype.afterContent = function () {
				var caption = this.$currentTarget.find('img').attr('title');
				this.$instance.find('.caption').remove();
				$('<div class="caption">').text(caption).appendTo(this.$instance.find('.featherlight-content'));
			}
		</script>
	</body>
</html>		
		
	<?php
	
}

?>
